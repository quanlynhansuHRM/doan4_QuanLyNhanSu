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

    app.get("/dsphongban", async (req, res) => {
      try {
        const [danhSachPhongBan] = await db.execute("SELECT * FROM phongban");
        res.json(danhSachPhongBan);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách phòng ban:", err.message);
        res
          .status(500)
          .json({ error: "Lỗi truy vấn MySQL", details: err.message });
      }
    });

    app.get("/dsphongban/:ma_phongban", async (req, res) => {
      try {
        const { ma_phongban } = req.params;

        const queryPhongBan = "SELECT * FROM phongban WHERE ma_phongban = ?";
        const [phongban] = await db.execute(queryPhongBan, [ma_phongban]);

        if (phongban.length === 0) {
          return res.status(404).json({ message: "Phòng ban không tồn tại" });
        }

        const queryNhanVien = `
        SELECT nv.ma_nhanvien, nv.ten, nv.sdt, 
               cv.ten_chucvu AS chuc_vu, nv.trang_thai, nv.gioi_tinh
        FROM nhanvien nv
        JOIN chucvu cv ON nv.ma_chucvu = cv.ma_chucvu
        WHERE nv.ma_phongban = ?
      `;
        const [danhSachNhanVien] = await db.execute(queryNhanVien, [
          ma_phongban,
        ]);

        res.json(danhSachNhanVien);
      } catch (err) {
        console.error("Lỗi truy vấn MySQL:", err.message);
        res
          .status(500)
          .json({ error: "Lỗi truy vấn MySQL", details: err.message });
      }
    });

    app.listen(5005, () => {
      console.log("Server chạy tại http://localhost:5005");
    });
  } catch (err) {
    console.error("Không thể khởi động server do lỗi MySQL:", err.message);
  }
}

startServer();
