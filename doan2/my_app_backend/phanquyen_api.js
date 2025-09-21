const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const bcrypt = require("bcrypt");
const logAudit = require("./utils/auditLog");

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function startServer() {
  try {
    db = await connectDB();
    app.post("/login", async (req, res) => {
      const { ma_nhanvien, password } = req.body;

      if (!ma_nhanvien || !password) {
        return res.status(400).json({ error: "Thiếu thông tin đăng nhập" });
      }

      try {
        const [rows] = await db.execute(
          `
          SELECT nv.ma_nhanvien, nv.ho, nv.ten, nv.role, nv.password, nv.ma_phongban,
       nv.ma_chucvu, cv.ten_chucvu, nv.trang_thai
FROM nhanvien nv
JOIN chucvu cv ON nv.ma_chucvu = cv.ma_chucvu
WHERE nv.ma_nhanvien = ?

          `,
          [ma_nhanvien]
        );

        if (rows.length === 0) {
          return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
        }
        const user = rows[0];

        if (user.trang_thai === 0) {
          return res
            .status(403)
            .json({ error: "Tài khoản đã bị dừng hoạt động" });
        }

        user.chucvu = user.ten_chucvu;
        delete user.ten_chucvu;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
        }

        delete user.password;

        // Ghi log truy vết ĐĂNG NHẬP
        await logAudit(db, {
          actionType: "LOGIN",
          tableName: "nhanvien",
          recordId: null,
          performedBy: user.ma_nhanvien,
          changes: {
            ten: user.ten,
            chucvu: user.chucvu,
            thongbao: "Đăng nhập thành công",
          },
        });

        res.json({ message: "Đăng nhập thành công", user });
      } catch (err) {
        console.error("Lỗi khi kiểm tra đăng nhập:", err.message);
        res.status(500).json({ error: "Lỗi server khi kiểm tra tài khoản" });
      }
    });
    app.put("/nhanvien/:id", async (req, res) => {
      const { id } = req.params;
      const { ho, ten, gioitinh, ma_phongban, ma_chucvu, trang_thai } =
        req.body;

      const performedBy = req.body.nguoi_thuchien;

      try {
        const [oldRows] = await db.execute(
          `SELECT * FROM nhanvien WHERE ma_nhanvien = ?`,
          [id]
        );
        if (oldRows.length === 0) {
          return res.status(404).json({ error: "Không tìm thấy nhân viên" });
        }
        const oldData = oldRows[0];

        // Cập nhật nhân viên
        await db.execute(
          `
      UPDATE nhanvien SET ho = ?, ten = ?, gioitinh = ?, ma_phongban = ?, ma_chucvu = ?, trang_thai = ?
      WHERE ma_nhanvien = ?
    `,
          [ho, ten, gioitinh, ma_phongban, ma_chucvu, trang_thai, id]
        );

        // So sánh và tạo thông tin thay đổi
        const changes = {};
        if (oldData.ho !== ho) changes.ho = [oldData.ho, ho];
        if (oldData.ten !== ten) changes.ten = [oldData.ten, ten];
        if (oldData.gioitinh !== gioitinh)
          changes.gioitinh = [oldData.gioitinh, gioitinh];
        if (oldData.ma_phongban !== ma_phongban)
          changes.phongban = [oldData.ma_phongban, ma_phongban];
        if (oldData.ma_chucvu !== ma_chucvu)
          changes.chucvu = [oldData.ma_chucvu, ma_chucvu];
        if (oldData.trang_thai !== trang_thai)
          changes.trang_thai = [oldData.trang_thai, trang_thai];

        // Ghi log truy vết
        await logAudit(db, {
          actionType: "UPDATE",
          tableName: "nhanvien",
          recordId: id,
          performedBy,
          changes,
        });

        res.json({ message: "Cập nhật nhân viên thành công" });
      } catch (err) {
        console.error("Lỗi cập nhật nhân viên:", err.message);
        res.status(500).json({ error: "Lỗi server khi cập nhật nhân viên" });
      }
    });

    app.get("/auditlogs", async (req, res) => {
      const role = req.query.role;
      const ma_nhanvien = req.query.ma_nhanvien;

      if (!role || role !== "admin") {
        return res
          .status(403)
          .json({ error: "Không có quyền truy cập nhật ký hệ thống" });
      }

      try {
        const [logs] = await db.execute(`
          SELECT * FROM audit_logs ORDER BY performed_at DESC
        `);
        res.json(logs);
      } catch (err) {
        console.error("Lỗi khi truy vấn audit logs:", err.message);
        res.status(500).json({ error: "Lỗi server khi lấy audit logs" });
      }
    });
    app.listen(5007, () => {
      console.log("Server đang chạy tại http://localhost:5007");
    });
  } catch (err) {
    console.error("Không thể khởi động server do lỗi MySQL");
  }
}

startServer();
