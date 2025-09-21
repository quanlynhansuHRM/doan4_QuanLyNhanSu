const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    const db = await connectDB();

    // TẠO ĐƠN NGHỈ
    app.post("/don_xinnghi", async (req, res) => {
      const { ma_nhanvien, ten, ngay_nghi, ly_do, ca_nghi, nghi_ca_hay_ngay } =
        req.body;

      if (!ma_nhanvien || !ten || !ngay_nghi || !ly_do || !nghi_ca_hay_ngay) {
        return res.status(400).json({ message: "Thiếu thông tin đơn." });
      }

      if (nghi_ca_hay_ngay === "Ca" && !ca_nghi) {
        return res.status(400).json({ message: "Vui lòng chọn ca muốn nghỉ." });
      }

      // Kiểm tra có ca làm không
      if (nghi_ca_hay_ngay === "Ca") {
        const weekdays = [
          "Chủ nhật",
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
        ];
        const dayOfWeek = weekdays[new Date(ngay_nghi).getDay()];

        const [rows] = await db.execute(
          `SELECT * FROM work_schedule WHERE ma_nhanvien = ? AND day_of_week = ? AND shift = ?`,
          [ma_nhanvien, dayOfWeek, ca_nghi]
        );

        if (rows.length === 0) {
          return res.status(400).json({
            message: "Không có ca làm việc trong ca đã chọn để nghỉ.",
          });
        }
      }

      try {
        const sql = `
          INSERT INTO don_xin_nghi_phep 
          (ma_nhanvien, ten, ngay_nghi, ly_do, ca_nghi, nghi_ca_hay_ngay)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.execute(sql, [
          ma_nhanvien,
          ten,
          ngay_nghi,
          ly_do,
          ca_nghi || null,
          nghi_ca_hay_ngay,
        ]);

        res.status(201).json({ message: "Đơn đã được gửi thành công." });
      } catch (err) {
        console.error("Lỗi khi ghi đơn:", err);
        res.status(500).json({ message: "Lỗi máy chủ khi ghi đơn." });
      }
    });

    // LẤY DANH SÁCH ĐƠN CHỜ DUYỆT
    app.get("/don_xinnghi/chuaduyet", async (req, res) => {
      try {
        const sql = `
          SELECT d.*, n.ma_phongban
          FROM don_xin_nghi_phep d
          JOIN nhanvien n ON d.ma_nhanvien = n.ma_nhanvien
          WHERE d.trang_thai = 'Chờ duyệt'
          ORDER BY d.ngay_gui DESC
        `;
        const [rows] = await db.execute(sql);
        res.json(rows);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn:", err);
        res.status(500).json({ message: "Lỗi máy chủ." });
      }
    });

    // DUYỆT ĐƠN
    app.put("/don_xinnghi/:id", async (req, res) => {
      const { id } = req.params;
      const { trang_thai, ma_nhanvien, role, ma_phongban } = req.body;

      try {
        const [rows] = await db.execute(
          "SELECT * FROM don_xin_nghi_phep WHERE id = ?",
          [id]
        );
        if (rows.length === 0) {
          return res.status(404).json({ message: "Không tìm thấy đơn nghỉ." });
        }

        const don = rows[0];

        // Cập nhật trạng thái đơn nghỉ
        await db.execute(
          "UPDATE don_xin_nghi_phep SET trang_thai = ? WHERE id = ?",
          [trang_thai, id]
        );

        if (trang_thai === "Đã duyệt") {
          const weekdays = [
            "Chủ nhật",
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
          ];
          const ngay_nghi = weekdays[new Date(don.ngay_nghi).getDay()];

          if (don.nghi_ca_hay_ngay === "Ca") {
            await db.execute(
              `UPDATE work_schedule 
           SET ghi_chu = CONCAT(IFNULL(ghi_chu, ''), ' [Xin nghỉ]') 
           WHERE ma_nhanvien = ? AND day_of_week = ? AND shift = ?`,
              [don.ma_nhanvien, ngay_nghi, don.ca_nghi]
            );
          } else {
            const caList = ["Sáng", "Chiều", "Tối"];
            for (const ca of caList) {
              await db.execute(
                `UPDATE work_schedule 
             SET ghi_chu = CONCAT(IFNULL(ghi_chu, ''), ' [Xin nghỉ]') 
             WHERE ma_nhanvien = ? AND day_of_week = ? AND shift = ?`,
                [don.ma_nhanvien, ngay_nghi, ca]
              );
            }
          }
        }

        res.json({ message: "Cập nhật trạng thái đơn thành công" });
      } catch (err) {
        console.error("Lỗi duyệt đơn:", err);
        res.status(500).json({ error: "Không thể cập nhật đơn nghỉ" });
      }
    });

    // LẤY DANH SÁCH ĐƠN ĐÃ XỬ LÝ
    app.get("/don_xinnghi/daxuly", async (req, res) => {
      try {
        const { ma_phongban, role } = req.query;
        let sql = `
      SELECT d.*, n.ma_phongban
      FROM don_xin_nghi_phep d
      JOIN nhanvien n ON d.ma_nhanvien = n.ma_nhanvien
      WHERE d.trang_thai IN ('Đã duyệt', 'Từ chối')
    `;
        const params = [];

        if (role === "quan ly" && ma_phongban) {
          sql += " AND n.ma_phongban = ?";
          params.push(ma_phongban);
        }

        sql += " ORDER BY d.ngay_gui DESC";

        const [rows] = await db.execute(sql, params);
        res.json(rows);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn đã xử lý:", err);
        res.status(500).json({ message: "Lỗi máy chủ." });
      }
    });

    // LẤY ĐƠN THEO MÃ NHÂN VIÊN
    app.get("/don_xinnghi/theo-nv/:ma_nhanvien", async (req, res) => {
      const { ma_nhanvien } = req.params;
      try {
        const sql = `
          SELECT * FROM don_xin_nghi_phep 
          WHERE ma_nhanvien = ? 
          ORDER BY ngay_gui DESC
        `;
        const [rows] = await db.execute(sql, [ma_nhanvien]);
        res.json(rows);
      } catch (err) {
        console.error("Lỗi khi lấy đơn theo nhân viên:", err);
        res.status(500).json({ message: "Lỗi máy chủ." });
      }
    });

    // HỦY ĐƠN
    app.delete("/don_xinnghi/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const [check] = await db.execute(
          `SELECT * FROM don_xin_nghi_phep WHERE id = ? AND trang_thai = 'Chờ duyệt'`,
          [id]
        );
        if (check.length === 0) {
          return res.status(400).json({
            message: "Không thể hủy đơn đã xử lý hoặc không tồn tại.",
          });
        }

        await db.execute(`DELETE FROM don_xin_nghi_phep WHERE id = ?`, [id]);
        res.json({ message: "Đã hủy đơn nghỉ phép." });
      } catch (err) {
        console.error("Lỗi khi hủy đơn:", err);
        res.status(500).json({ message: "Lỗi máy chủ." });
      }
    });

    const PORT = process.env.PORT || 5014;
    app.listen(PORT, () => {
      console.log(`API nhân viên chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(" Không thể kết nối MySQL:", err.message);
  }
}

startServer();
