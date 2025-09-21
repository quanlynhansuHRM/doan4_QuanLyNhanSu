const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

let db;

connectDB()
  .then((database) => {
    db = database;
    console.log("Kết nối database thành công!");
  })
  .catch((err) => {
    console.error("Lỗi kết nối database:", err.message);
  });

app.post("/thempb", async (req, res) => {
  try {
    const { ma_phongban, ten_phongban, truongphong_id, ngay_thanh_lap } =
      req.body;

    if (!ma_phongban || !ten_phongban) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập đầy đủ thông tin bắt buộc." });
    }

    const [existing] = await db.execute(
      "SELECT ma_phongban,ten_phongban FROM phongban WHERE ten_phongban = ? AND ma_phongban = ?",
      [ten_phongban, ma_phongban]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: "Mã phòng ban hoặc tên phòng đã tồn tại trong hệ thống.",
      });
    }

    const query = `
      INSERT INTO phongban (
        ma_phongban, ten_phongban, truongphong_id, ngay_thanh_lap
      ) VALUES (?, ?, ?, ?)
    `;

    await db.execute(query, [
      ma_phongban,
      ten_phongban,
      truongphong_id || null,
      ngay_thanh_lap || null,
    ]);

    res.status(201).json({ message: "Thêm phòng ban thành công!" });
  } catch (err) {
    console.error(" Lỗi khi thêm phòng ban:", err);
    res.status(500).json({
      error: "Lỗi server",
      details: err.message,
      stack: err.stack,
    });
  }
});

app.post("/capnhat", async (req, res) => {
  try {
    const { ma_phongban, ten_phongban, truongphong_id, ngay_thanh_lap } =
      req.body;

    if (!ma_phongban || !ten_phongban) {
      return res.status(400).json({ error: "Thiếu mã hoặc tên phòng ban." });
    }

    const [check] = await db.execute(
      "SELECT * FROM phongban WHERE ma_phongban = ?",
      [ma_phongban]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Phòng ban không tồn tại." });
    }

    // Cập nhật thông tin
    await db.execute(
      "UPDATE phongban SET ten_phongban = ?, truongphong_id = ?, ngay_thanh_lap = ? WHERE ma_phongban = ?",
      [
        ten_phongban,
        truongphong_id || null,
        ngay_thanh_lap || null,
        ma_phongban,
      ]
    );

    res.json({ message: "Cập nhật phòng ban thành công!" });
  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
});

const PORT = 5009;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
