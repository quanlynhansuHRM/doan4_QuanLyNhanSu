const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const cron = require("node-cron");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // điều chỉnh nếu muốn hạn chế origin
});

let connectedUsers = {}; // { ma_nhanvien: socketId }

// Socket.IO events
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("registerUser", (user) => {
    if (user?.ma_nhanvien) {
      connectedUsers[user.ma_nhanvien] = socket.id;
      console.log(" Registered user:", user.ma_nhanvien);
    }
  });

  socket.on("disconnect", () => {
    for (const id in connectedUsers) {
      if (connectedUsers[id] === socket.id) delete connectedUsers[id];
    }
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// =========================
async function startServer() {
  try {
    const db = await connectDB();
    console.log(" Đã kết nối CSDL từ db.js");

    // ---------- Helper: cập nhật trạng thái tự động ----------
    async function updateStatusesInDB() {
      try {
        const sql = `
          UPDATE congviec
          SET trang_thai = CASE
            WHEN (trang_thai = 'Hoàn thành') THEN 'Hoàn thành'
            WHEN NOW() < IFNULL(ngay_bat_dau, '1000-01-01 00:00:00') THEN 'Chưa bắt đầu'
            WHEN NOW() BETWEEN IFNULL(ngay_bat_dau, '1000-01-01 00:00:00') 
                         AND IFNULL(ngay_ket_thuc, '3000-01-01 00:00:00') THEN 'Đang thực hiện'
            WHEN NOW() > IFNULL(ngay_ket_thuc, '3000-01-01 00:00:00') 
                 AND trang_thai != 'Hoàn thành' THEN 'Quá hạn'
            ELSE trang_thai
          END
        `;
        await db.execute(sql);
        console.log(" [Cron] Cập nhật trạng thái công việc tự động.");
      } catch (err) {
        console.error(" Lỗi updateStatusesInDB:", err.message || err);
        throw err;
      }
    }

    // Cron mỗi 2 phút (thay đổi theo nhu cầu)
    cron.schedule("*/1 * * * *", async () => {
      try {
        await updateStatusesInDB();
      } catch (e) {
        // already logged
      }
    });

    // =========================================================
    // API: Lấy danh sách nhân viên
    app.get("/dsnhanvien", async (req, res) => {
      const { role, phongban, ma_nhanvien } = req.query;
      try {
        let query = `
          SELECT 
            ma_nhanvien,
            CONCAT_WS(' ', ho, ten) AS hoten,
            ma_phongban AS phongban
          FROM nhanvien
          WHERE trang_thai = 1
        `;
        const params = [];

        if (role === "quan ly" || role === "quan_ly") {
          query += " AND ma_phongban = ?";
          params.push(phongban);
        } else if (role === "nhan_vien") {
          query += " AND ma_nhanvien = ?";
          params.push(ma_nhanvien);
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
      } catch (err) {
        console.error(" Lỗi /dsnhanvien:", err.message || err);
        res.status(500).json({ error: "Không thể lấy danh sách nhân viên" });
      }
    });

    // =========================================================
    //  API: Lấy danh sách công việc (gộp thông tin người được giao)
    app.get("/congviec", async (req, res) => {
      const { role, ma_nhanvien, phongban } = req.query;
      try {
        let sql = `
      SELECT 
        cv.*,
        CONCAT(ng.ho, ' ', ng.ten) AS ten_nguoi_giao,
        GROUP_CONCAT(CONCAT_WS(' ', nd.ho, nd.ten, CONCAT('(', nd.ma_nhanvien, ')')) SEPARATOR ', ') AS thong_tin_nguoi_duoc_giao,
        GROUP_CONCAT(nd.ma_nhanvien) AS ds_ma_nguoi_duoc_giao
      FROM congviec cv
      LEFT JOIN nhanvien ng ON cv.nguoi_giao = ng.ma_nhanvien
      LEFT JOIN congviec_nguoi_duoc_giao cndg ON cv.id = cndg.id_congviec
      LEFT JOIN nhanvien nd ON cndg.ma_nhanvien = nd.ma_nhanvien
    `;
        const conditions = [];
        const params = [];

        if (role === "nhan_vien") {
          conditions.push("cndg.ma_nhanvien = ?");
          params.push(ma_nhanvien);
        } else if (role === "quan_ly" || role === "quan ly") {
          conditions.push("(cv.nguoi_giao = ? OR ng.ma_phongban = ?)");
          params.push(ma_nhanvien, phongban);
        }

        if (conditions.length) sql += " WHERE " + conditions.join(" AND ");

        sql += " GROUP BY cv.id ORDER BY cv.id DESC";

        const [rows] = await db.execute(sql, params);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Không thể lấy công việc" });
      }
    });

    //  API: Thống kê năng suất nhân viên
    // Trả về: [{ ma_nhanvien, hoten, tong_viec, hoan_thanh, qua_han }]
    app.get("/thongke/nangsuat", async (req, res) => {
      const { role, phongban, ma_nhanvien } = req.query;
      try {
        // Lấy thống kê: join congviec_nguoi_duoc_giao -> congviec

        let sql = `
      SELECT
        nv.ma_nhanvien,
        CONCAT_WS(' ', nv.ho, nv.ten) AS hoten,
        COUNT(cv.id) AS tong_viec,
        SUM(CASE WHEN cv.trang_thai = 'Hoàn thành' THEN 1 ELSE 0 END) AS hoan_thanh,
        SUM(CASE WHEN cv.trang_thai = 'Quá hạn' THEN 1 ELSE 0 END) AS qua_han
      FROM nhanvien nv
      LEFT JOIN congviec_nguoi_duoc_giao cndg ON nv.ma_nhanvien = cndg.ma_nhanvien
      LEFT JOIN congviec cv ON cndg.id_congviec = cv.id
      WHERE nv.trang_thai = 1
    `;
        const params = [];

        // Áp dụng quyền/lọc theo role
        if (role === "nhan_vien") {
          sql += " AND nv.ma_nhanvien = ?";
          params.push(ma_nhanvien);
        } else if (role === "quan_ly" || role === "quan ly") {
          sql += " AND nv.ma_phongban = ?";
          params.push(phongban);
        }

        sql += `
      GROUP BY nv.ma_nhanvien
      ORDER BY hoan_thanh DESC, tong_viec DESC
    `;

        const [rows] = await db.execute(sql, params);

        //  tỉ lệ hoàn thành
        const data = rows.map((r) => {
          const tong = Number(r.tong_viec || 0);
          const hoan = Number(r.hoan_thanh || 0);
          return {
            ...r,
            tong_viec: tong,
            hoan_thanh: hoan,
            qua_han: Number(r.qua_han || 0),
            ti_le_hoan_thanh:
              tong === 0 ? 0 : Math.round((hoan / tong) * 100 * 100) / 100,
          };
        });

        res.json(data);
      } catch (err) {
        console.error(" Lỗi /thongke/nangsuat:", err.message || err);
        res.status(500).json({ error: "Không thể lấy thống kê năng suất" });
      }
    });

    // =========================================================
    //  Thêm công việc
    app.post("/congviec", async (req, res) => {
      const {
        ten_cong_viec,
        mo_ta,
        nguoi_giao,
        nguoi_duoc_giao,
        ngay_bat_dau,
        ngay_ket_thuc,
        trang_thai,
      } = req.body;

      if (
        !ten_cong_viec ||
        !nguoi_giao ||
        !Array.isArray(nguoi_duoc_giao) ||
        nguoi_duoc_giao.length === 0
      ) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const normalize = (v) => (v ? v.replace("T", " ") : null);

        const [result] = await conn.execute(
          `INSERT INTO congviec (ten_cong_viec, mo_ta, nguoi_giao, ngay_bat_dau, ngay_ket_thuc, trang_thai)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ten_cong_viec,
            mo_ta ?? "",
            nguoi_giao,
            normalize(ngay_bat_dau),
            normalize(ngay_ket_thuc),
            trang_thai ?? "Chưa bắt đầu",
          ]
        );

        const id_congviec = result.insertId;

        // Insert người được giao
        for (const ma of nguoi_duoc_giao) {
          await conn.execute(
            `INSERT INTO congviec_nguoi_duoc_giao (id_congviec, ma_nhanvien)
             VALUES (?, ?)`,
            [id_congviec, ma]
          );
        }

        await conn.commit();

        // Cập nhật trạng thái ngay
        try {
          await updateStatusesInDB();
        } catch (e) {
          // không block trả về nếu cron lỗi
        }

        // ---------- Realtime: gửi thông báo ----------
        // gửi cho từng người được giao (nếu online)
        nguoi_duoc_giao.forEach((ma) => {
          const socketId = connectedUsers[ma];
          if (socketId) {
            io.to(socketId).emit("newTask", {
              message: ` Bạn vừa được giao công việc mới: ${ten_cong_viec}`,
            });
          }
        });

        // test-mode: gửi luôn cho chính người tạo (nếu online) để tiện test 1 tab
        const creatorSocket = connectedUsers[nguoi_giao];
        if (creatorSocket) {
          io.to(creatorSocket).emit("newTask", {
            message: ` Bạn vừa giao công việc: ${ten_cong_viec}`,
          });
        }

        res.json({ success: true, id: id_congviec });
      } catch (err) {
        await conn.rollback();
        console.error(" Lỗi POST /congviec:", err.message || err);
        res.status(500).json({ error: err.message || "Lỗi thêm công việc" });
      } finally {
        conn.release();
      }
    });

    // =========================================================
    // API: Cập nhật công việc
    app.put("/congviec/:id", async (req, res) => {
      const { id } = req.params;
      const {
        ten_cong_viec,
        mo_ta,
        nguoi_giao,
        nguoi_duoc_giao = [],
        ngay_bat_dau,
        ngay_ket_thuc,
        trang_thai,
      } = req.body;

      const normalize = (v) => (v ? v.replace("T", " ") : null);
      const conn = await db.getConnection();

      try {
        await conn.beginTransaction();

        //  Kiểm tra dữ liệu bắt buộc
        if (!ten_cong_viec || !nguoi_giao) {
          throw new Error("Thiếu tên công việc hoặc người giao");
        }

        //  Cập nhật thông tin công việc
        await conn.execute(
          `UPDATE congviec 
       SET ten_cong_viec=?, mo_ta=?, nguoi_giao=?, ngay_bat_dau=?, ngay_ket_thuc=?, trang_thai=?
       WHERE id=?`,
          [
            ten_cong_viec,
            mo_ta ?? "",
            nguoi_giao,
            normalize(ngay_bat_dau),
            normalize(ngay_ket_thuc),
            trang_thai ?? "Chưa bắt đầu",
            id,
          ]
        );

        //  Cập nhật lại danh sách người được giao
        await conn.execute(
          `DELETE FROM congviec_nguoi_duoc_giao WHERE id_congviec=?`,
          [id]
        );

        if (Array.isArray(nguoi_duoc_giao) && nguoi_duoc_giao.length > 0) {
          for (const ma of nguoi_duoc_giao) {
            await conn.execute(
              `INSERT INTO congviec_nguoi_duoc_giao (id_congviec, ma_nhanvien)
           VALUES (?, ?)`,
              [id, ma]
            );
          }
        }

        await conn.commit();

        // Chỉ gọi cron auto-update nếu KHÔNG có trạng_thai gửi từ frontend
        // (nghĩa là người dùng không cố gắng thay đổi thủ công)
        if (
          typeof trang_thai === "undefined" ||
          trang_thai === null ||
          trang_thai === ""
        ) {
          try {
            await updateStatusesInDB();
          } catch (e) {
            console.error("updateStatusesInDB error:", e.message);
          }
        } else {
          console.log(` Manual update: Task ${id} set to '${trang_thai}'`);
        }

        res.json({ message: " Cập nhật công việc thành công" });
      } catch (err) {
        await conn.rollback();
        console.error(" Lỗi PUT /congviec/:id:", err.message || err);
        res.status(500).json({ error: err.message || "Lỗi cập nhật" });
      } finally {
        conn.release();
      }
    });

    // =========================================================
    //  Hoàn thành công việc
    app.put("/congviec/hoanthanh/:id", async (req, res) => {
      const { id } = req.params;
      // frontend gửi: { nguoi_thuchien: 'NV001', nguoi_giao: 'QL01', ten_cong_viec: '...' }
      const { nguoi_thuchien, nguoi_giao, ten_cong_viec } = req.body;

      try {
        await db.query(
          "UPDATE congviec SET trang_thai = 'Hoàn thành' WHERE id = ?",
          [id]
        );

        // realtime: gửi cho người giao (nếu online)
        const socketId = connectedUsers[nguoi_giao];
        if (socketId) {
          io.to(socketId).emit("taskCompleted", {
            message: ` Nhân viên ${nguoi_thuchien} đã hoàn thành công việc: ${ten_cong_viec}`,
          });
        }

        // test-mode: gửi cho chính người hoàn thành (nếu online)
        const selfSocket = connectedUsers[nguoi_thuchien];
        if (selfSocket) {
          io.to(selfSocket).emit("taskCompleted", {
            message: ` Bạn đã hoàn thành công việc: ${ten_cong_viec}`,
          });
        }

        res.json({ message: "Đã cập nhật trạng thái hoàn thành" });
      } catch (error) {
        console.error(
          " Lỗi PUT /congviec/hoanthanh/:id:",
          error.message || error
        );
        res.status(500).json({ error: "Không thể cập nhật hoàn thành" });
      }
    });

    // =========================================================
    // Xóa công việc
    app.delete("/congviec/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const [result] = await db.execute("DELETE FROM congviec WHERE id=?", [
          id,
        ]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Không tìm thấy công việc." });
        }
        res.json({ success: true });
      } catch (err) {
        console.error(" Lỗi DELETE /congviec/:id:", err.message || err);
        res.status(500).json({ error: "Lỗi xóa công việc" });
      }
    });

    // =========================================================
    //  Manual update statuses (debug)
    app.post("/congviec/update-statuses", async (req, res) => {
      try {
        await updateStatusesInDB();
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Lỗi khi cập nhật trạng thái" });
      }
    });

    // Start server
    const PORT = process.env.PORT || 5015;
    server.listen(PORT, () =>
      console.log(` API + Socket.IO chạy tại http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error(" Lỗi khởi động server:", err.message || err);
    process.exit(1);
  }
}

startServer();
