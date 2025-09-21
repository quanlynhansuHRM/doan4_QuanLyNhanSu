const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const connectDB = require("./db");
const logAudit = require("./utils/auditLog");

const app = express();
app.use(cors());
app.use(express.json());

let db;
const formatDate = (value) => {
  if (value && typeof value === "string" && value.includes("T")) {
    return value.split("T")[0];
  }
  return value;
};

connectDB()
  .then((database) => {
    db = database;
  })
  .catch((err) => {
    console.error("Không thể kết nối database:", err.message);
    process.exit(1);
  });

// Lấy danh sách nhân viên (lọc theo phòng ban & tìm kiếm + trạng thái + chức vụ)
app.get("/dsnhanvien", async (req, res) => {
  try {
    const {
      keyword = "",
      ma_phongban = "",
      role = "",
      filter_phongban = "",
      filter_trangthai = "",
      filter_chucvu = "",
    } = req.query;

    let query = "SELECT ma_nhanvien, ho, ten FROM nhanvien WHERE 1=1";
    const params = [];

    // Nếu không phải admin thì lọc theo phòng ban của user
    if (role === "quan ly" && ma_phongban) {
      query += " AND ma_phongban = ?";
      params.push(ma_phongban);
    }

    // Lọc theo từ khóa
    if (keyword.trim()) {
      query += " AND (ma_nhanvien LIKE ? OR ho LIKE ? OR ten LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // Lọc theo phòng ban chọn từ dropdown
    if (filter_phongban) {
      query += " AND ma_phongban = ?";
      params.push(filter_phongban);
    }

    // Lọc theo trạng thái làm việc
    if (filter_trangthai !== "") {
      query += " AND trang_thai = ?";
      params.push(filter_trangthai);
    }

    // Lọc theo chức vụ
    if (filter_chucvu) {
      query += " AND ma_chucvu = ?";
      params.push(filter_chucvu);
    }

    // Sắp xếp cho dễ nhìn
    query += " ORDER BY ho, ten";

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách nhân viên:", err);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách nhân viên." });
  }
});

// Lấy chi tiết nhân viên
app.get("/nhansu/:ma_nhanvien", async (req, res) => {
  try {
    const { ma_nhanvien } = req.params;
    const [rows] = await db.execute(
      `SELECT nv.*, pb.ten_phongban 
       FROM nhanvien nv 
       LEFT JOIN phongban pb ON nv.ma_phongban = pb.ma_phongban 
       WHERE nv.ma_nhanvien = ?`,
      [ma_nhanvien]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    res.json(rows[0]);
  } catch (err) {
    console.error("Lỗi lấy thông tin nhân viên:", err);
    res.status(500).json({ error: "Lỗi server." });
  }
});

// Cập nhật nhân viên
app.put("/nhansu/:ma_nhanvien", async (req, res) => {
  try {
    const { ma_nhanvien } = req.params;
    const {
      ho,
      ten,
      password,
      gioi_tinh,
      ngay_sinh,
      ngay_vao_lam,
      sdt,
      luong_cb,
      ma_chucvu,
      trang_thai,
      ten_phongban,
      role,
      nguoi_thuchien,
      role_nguoi_tao,
    } = req.body;

    // Lấy dữ liệu cũ
    const [oldRows] = await db.execute(
      "SELECT * FROM nhanvien WHERE ma_nhanvien = ?",
      [ma_nhanvien]
    );
    if (oldRows.length === 0)
      return res.status(404).json({ error: "Nhân viên không tồn tại." });

    const oldData = oldRows[0];

    // Kiểm tra quyền chỉnh sửa
    if (oldData.role === "admin" && role_nguoi_tao !== "admin") {
      return res.status(403).json({
        error: "Chỉ admin mới được phép chỉnh sửa tài khoản admin!",
      });
    }

    if (oldData.role === "quan ly" && role_nguoi_tao !== "admin") {
      return res.status(403).json({
        error: "Chỉ admin mới được phép chỉnh sửa tài khoản quản lý!",
      });
    }

    // Xác định lại ma_phongban nếu ten_phongban có đổi
    let ma_phongban = oldData.ma_phongban;
    if (ten_phongban) {
      const [pbRows] = await db.execute(
        "SELECT ma_phongban FROM phongban WHERE ten_phongban = ?",
        [ten_phongban]
      );
      if (pbRows.length > 0) ma_phongban = pbRows[0].ma_phongban;
    }

    // So sánh trường thay đổi
    const fields = [];
    const values = [];
    const changes = {};

    const updateField = async (key, newValue, hash = false) => {
      if (
        newValue !== undefined &&
        newValue !== "" &&
        newValue !== oldData[key]
      ) {
        const val = hash ? await bcrypt.hash(newValue, 10) : newValue;
        fields.push(`\`${key}\` = ?`);
        values.push(val);
        changes[key] = {
          old: oldData[key],
          new: hash ? "[BCRYPTED]" : newValue,
        };
      }
    };

    await updateField("ho", ho);
    await updateField("ten", ten);
    await updateField("gioi_tinh", gioi_tinh);
    await updateField("ngay_sinh", formatDate(ngay_sinh));
    await updateField("ngay_vao_lam", formatDate(ngay_vao_lam));
    await updateField("sdt", sdt);
    await updateField("luong_cb", luong_cb);
    await updateField("ma_chucvu", ma_chucvu);
    await updateField("trang_thai", trang_thai);
    await updateField("ma_phongban", ma_phongban);
    await updateField("role", role);
    await updateField("password", password, true);

    // Nếu không thay đổi gì
    if (fields.length === 0) {
      console.log("Không có trường nào thay đổi.");
      await logAudit(db, {
        actionType: "NO_CHANGE",
        tableName: "nhanvien",
        recordId: ma_nhanvien,
        performedBy: nguoi_thuchien || "unknown",
        changes: {},
      });
      return res.status(200).json({ message: "Không có thay đổi." });
    }

    // Cập nhật DB
    await db.execute(
      `UPDATE nhanvien SET ${fields.join(", ")} WHERE ma_nhanvien = ?`,
      [...values, ma_nhanvien]
    );

    // Ghi log cập nhật
    try {
      console.log("Người thực hiện:", nguoi_thuchien);
      console.log("Thay đổi:", changes);

      await logAudit(db, {
        actionType: "UPDATE",
        tableName: "nhanvien",
        recordId: ma_nhanvien,
        performedBy: nguoi_thuchien || "unknown",
        changes,
      });

      console.log("Ghi log thành công!");
    } catch (logErr) {
      console.error("Không thể ghi log thay đổi:", logErr.message);
    }

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi cập nhật nhân viên:", err);
    res.status(500).json({
      error: "Lỗi máy chủ khi cập nhật.",
      detail: err.message,
    });
  }
});

// API lấy lịch sử truy vết
app.get("/audit-logs/:ma_nhanvien", async (req, res) => {
  const { ma_nhanvien } = req.params;

  try {
    const [logs] = await db.execute(
      `SELECT * FROM audit_logs 
       WHERE table_name = 'nhanvien' AND record_id = ? 
       ORDER BY created_at DESC`,
      [ma_nhanvien]
    );
    res.json(logs);
  } catch (err) {
    console.error("Lỗi truy vấn audit logs:", err.message);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử chỉnh sửa." });
    console.error("Không thể ghi log thay đổi:", logErr.message);
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
