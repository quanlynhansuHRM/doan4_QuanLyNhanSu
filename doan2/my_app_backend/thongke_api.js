const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function startServer() {
  try {
    db = await connectDB();

    // Thống kê tổng nhân viên, đang làm, nghỉ việc
    app.get("/thongke", async (req, res) => {
      try {
        const [rows] = await db.execute(`
          SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN trang_thai = 1 THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN trang_thai = 0 THEN 1 ELSE 0 END) AS inactive
          FROM nhanvien;
        `);
        res.json(rows[0]);
      } catch (err) {
        res.status(500).json({ error: "Lỗi truy vấn MySQL" });
      }
    });

    // Thống kê lương theo tháng (tất cả nhân viên)
    app.get("/luong_theo_thang", async (req, res) => {
      try {
        const [rows] = await db.execute(`
          SELECT thang, nam, SUM(tong_luong) AS tong_luong_thang
          FROM luong
          GROUP BY thang, nam
          ORDER BY nam DESC, thang DESC;
        `);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Lỗi truy vấn MySQL" });
      }
    });

    // Thống kê lương theo phòng ban theo tháng
    app.get("/luong_theo_phongban_thang", async (req, res) => {
      try {
        const [rows] = await db.execute(`
          SELECT 
            pb.ten_phongban, 
            l.thang, 
            l.nam, 
            SUM(l.tong_luong) AS tong_luong
          FROM luong l
          JOIN nhanvien nv ON l.ma_nhanvien = nv.ma_nhanvien
          JOIN phongban pb ON nv.ma_phongban = pb.ma_phongban
          GROUP BY pb.ten_phongban, l.thang, l.nam
          ORDER BY l.nam DESC, l.thang DESC, pb.ten_phongban;
        `);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Lỗi truy vấn MySQL" });
      }
    });

    app.listen(5003, () => {
      console.log("Server đang chạy tại http://localhost:5003");
    });
  } catch (err) {
    console.error("Không thể khởi động server do lỗi MySQL", err);
  }
}

startServer();
