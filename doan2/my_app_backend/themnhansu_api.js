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

// Lấy danh sách phòng ban
app.get("/phongban", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT ma_phongban, ten_phongban FROM phongban"
    );
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy phòng ban:", err);
    res.status(500).json({ error: "Không thể lấy danh sách phòng ban." });
  }
});

// Lấy danh sách chức vụ
app.get("/chucvu", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT ma_chucvu, ten_chucvu FROM chucvu");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy chức vụ:", err);
    res.status(500).json({ error: "Không thể lấy danh sách chức vụ." });
  }
});

// API thêm nhân sự + ghi log
app.post("/themnhansu", async (req, res) => {
  const {
    ten,
    ma_nhanvien,
    password,
    sdt,
    ma_chucvu,
    gioi_tinh,
    trang_thai,
    ma_phongban,
    ngay_sinh,
    ngay_vao_lam,
    role,
    luong_cb,
    ma_nhanvien_nguoi_tao,
    role_nguoi_tao,
    ma_phongban_nguoi_tao,
  } = req.body;

  if (
    !ten ||
    !ma_nhanvien ||
    !password ||
    !ma_chucvu ||
    !luong_cb ||
    !ma_phongban
  ) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
  }

  if (role_nguoi_tao === "quan ly" && ma_phongban !== ma_phongban_nguoi_tao) {
    return res
      .status(403)
      .json({ error: "Quản lý chỉ được tạo nhân sự trong cùng phòng ban." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm nhân sự
    await db.execute(
      `INSERT INTO nhanvien 
       (ten, ma_nhanvien, password, sdt, ma_chucvu, gioi_tinh, trang_thai, ma_phongban, ngay_sinh, ngay_vao_lam, role, luong_cb)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ten,
        ma_nhanvien,
        hashedPassword,
        sdt,
        ma_chucvu,
        gioi_tinh,
        trang_thai,
        ma_phongban,
        ngay_sinh,
        ngay_vao_lam,
        role,
        luong_cb,
      ]
    );

    // ghi log vào bảng audit_logs
    await db.execute(
      `INSERT INTO audit_logs (action_type, table_name, record_id, performed_by, changes) VALUES (?, ?, ?, ?, ?)`,
      [
        "INSERT",
        "nhanvien",
        null,
        ma_nhanvien_nguoi_tao,
        JSON.stringify({
          ma_nhanvien_moi: ma_nhanvien,
          ten,
          phongban: ma_phongban,
          chucvu: ma_chucvu,
          role,
        }),
      ]
    );

    res.json({ message: "Thêm nhân sự thành công." });
  } catch (error) {
    console.error("Lỗi thêm nhân sự:", error);
    res.status(500).json({ error: "Lỗi server khi thêm nhân sự." });
  }
});

const PORT = 5004;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
