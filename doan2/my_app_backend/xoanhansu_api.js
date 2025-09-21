const express = require("express");
const connectDB = require("./db");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.delete("/xoanhanvien/:ma_nhanvien", async (req, res) => {
  const { ma_nhanvien } = req.params;

  if (!ma_nhanvien) {
    return res.status(400).json({ error: "Mã nhân viên không hợp lệ" });
  }

  let connection;
  try {
    connection = await connectDB();

    const [result] = await connection.execute(
      "DELETE FROM nhanvien WHERE ma_nhanvien = ?",
      [ma_nhanvien]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    res.status(200).json({ message: "Xoá thành công" });
  } catch (err) {
    console.error(" Lỗi khi xoá:", err);
    res.status(500).json({ error: "Lỗi xoá nhân viên" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.listen(5006, () => {
  console.log("Server đang chạy trên cổng 5006");
});
