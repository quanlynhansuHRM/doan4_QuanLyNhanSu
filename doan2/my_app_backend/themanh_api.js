const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

//Lưu ảnh base64 và định dạng cho nhân viên
app.post("/themanh", async (req, res) => {
  const { maNV, anhDaiDien, dinhDang, role } = req.body;
  const authMaNV = req.headers["authorization"]; // Mã nhân viên thật đang đăng nhập

  if (!maNV || !anhDaiDien || !dinhDang || !role) {
    return res.status(400).send("Thiếu thông tin");
  }

  // ✅ Nếu là nhân viên thường, chỉ được cập nhật ảnh của chính mình
  if (role === "nhan_vien" && authMaNV !== maNV) {
    return res
      .status(403)
      .send("Bạn không có quyền cập nhật ảnh của nhân viên khác.");
  }

  try {
    const db = await connectDB();
    const [result] = await db.execute(
      `UPDATE nhanvien SET hinh_anh = ?, dinh_dang = ? WHERE ma_nhanvien = ?`,
      [anhDaiDien, dinhDang, maNV]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Không tìm thấy nhân viên");
    }

    res.send("Ảnh đã được lưu!");
  } catch (err) {
    console.error("Lỗi khi lưu ảnh:", err);
    res.status(500).send("Lỗi khi lưu ảnh");
  }
});

// Lấy thông tin nhân viên và ảnh
app.get("/themanh/:maNV", async (req, res) => {
  const { maNV } = req.params;

  try {
    const db = await connectDB();

    const [rows] = await db.execute(
      `SELECT * FROM nhanvien WHERE ma_nhanvien = ?`,
      [maNV]
    );

    if (rows.length === 0) {
      return res.status(404).send("Không tìm thấy nhân viên");
    }

    const nv = rows[0];
    const dinhDang = nv.dinh_dang || "jpeg";

    nv.anhDaiDienFull = `data:image/${dinhDang};base64,${nv.hinh_anh}`;
    res.json(nv);
  } catch (err) {
    console.error(err);
    res.status(500).send(" Lỗi khi lấy thông tin nhân viên");
  }
});

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(` API nhân viên chạy tại http://localhost:${PORT}`);
});
