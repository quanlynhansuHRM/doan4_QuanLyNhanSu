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

    app.get("/nhanvien_api", async (req, res) => {
      try {
        const { keyword, filter_phongban, filter_trangthai, filter_chucvu } =
          req.query;

        let sql = `
      SELECT 
        nv.ma_nhanvien,
        nv.ngay_sinh,
        nv.ho,
        nv.ten,
        nv.gioi_tinh,
        nv.ma_phongban,
        pb.ten_phongban,
        nv.ma_chucvu,
        cv.ten_chucvu,
        nv.ngay_vao_lam,
        nv.trang_thai,
        nv.sdt,
        nv.hinh_anh,
        nv.luong_cb
      FROM nhanvien nv
      JOIN phongban pb ON nv.ma_phongban = pb.ma_phongban
      JOIN chucvu cv ON nv.ma_chucvu = cv.ma_chucvu
      WHERE 1=1
    `;

        const params = [];

        if (keyword) {
          sql += ` AND (nv.ma_nhanvien LIKE ? OR nv.ho LIKE ? OR nv.ten LIKE ? OR nv.sdt LIKE ?)`;
          params.push(
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`
          );
        }
        if (filter_phongban) {
          sql += ` AND nv.ma_phongban = ?`;
          params.push(filter_phongban);
        }
        if (filter_trangthai !== undefined && filter_trangthai !== "") {
          sql += ` AND nv.trang_thai = ?`;
          params.push(filter_trangthai);
        }
        if (filter_chucvu) {
          sql += ` AND nv.ma_chucvu = ?`;
          params.push(filter_chucvu);
        }

        const [rows] = await db.execute(sql, params);
        res.json(rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi truy vấn MySQL" });
      }
    });

    app.listen(5000, () => {
      console.log("Server đang chạy tại http://localhost:5000");
    });
  } catch (err) {
    console.error("Không thể khởi động server do lỗi MySQL");
  }
}

startServer();
