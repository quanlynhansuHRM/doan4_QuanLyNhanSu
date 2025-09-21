const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const ExcelJS = require("exceljs");
const logAudit = require("./utils/auditLog");

const app = express();
app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    const db = await connectDB();

    // API tính lương cho 1 nhân viên
    app.get("/luong/:ma_nhanvien", async (req, res) => {
      try {
        const { ma_nhanvien } = req.params;
        const { thang, nam, thuong = 0, phat = 0 } = req.query;

        if (!ma_nhanvien) {
          return res
            .status(400)
            .json({ error: "Vui lòng cung cấp mã nhân viên." });
        }

        const today = new Date();
        const thangHienTai = today.getMonth() + 1;
        const namHienTai = today.getFullYear();

        const thangCanTinh = parseInt(thang) || thangHienTai;
        const namCanTinh = parseInt(nam) || namHienTai;

        const [luongData] = await db.execute(
          "SELECT luong_cb FROM nhanvien WHERE ma_nhanvien = ?",
          [ma_nhanvien]
        );

        if (luongData.length === 0) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên." });
        }

        const luong_cb = parseFloat(luongData[0].luong_cb);

        const [chamCongData] = await db.execute(
          "SELECT COUNT(*) AS so_cong FROM chamcong WHERE ma_nhanvien = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?",
          [ma_nhanvien, thangCanTinh, namCanTinh]
        );

        const so_cong = chamCongData[0]?.so_cong || 0;
        const tong_luong =
          (luong_cb / 26) * so_cong + parseFloat(thuong) - parseFloat(phat);

        // ✅ Ghi vào bảng lương
        await db.execute(
          `INSERT INTO luong (ma_nhanvien, thang, nam, luong_cb, so_cong, tong_luong)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         luong_cb = VALUES(luong_cb),
         so_cong = VALUES(so_cong),
         tong_luong = VALUES(tong_luong)`,
          [ma_nhanvien, thangCanTinh, namCanTinh, luong_cb, so_cong, tong_luong]
        );

        res.json({
          ma_nhanvien,
          thang: thangCanTinh,
          nam: namCanTinh,
          so_cong,
          thuong: parseFloat(thuong),
          phat: parseFloat(phat),
          tong_luong,
        });
      } catch (err) {
        console.error("Lỗi khi tính lương:", err);
        res.status(500).json({ error: "Lỗi server", details: err.message });
      }
    });

    // Tính & lưu bảng lương toàn bộ nhân viên
    app.post("/luong", async (req, res) => {
      try {
        const { thang, nam } = req.body;

        if (!thang || !nam) {
          return res
            .status(400)
            .json({ error: "Vui lòng cung cấp tháng và năm." });
        }

        const [nhanVienData] = await db.execute(
          "SELECT ma_nhanvien FROM nhanvien"
        );
        const danhSachLuong = [];

        for (const { ma_nhanvien } of nhanVienData) {
          const [luongData] = await db.execute(
            "SELECT luong_cb FROM nhanvien WHERE ma_nhanvien = ?",
            [ma_nhanvien]
          );

          const luong_cb = parseFloat(luongData[0]?.luong_cb || 0);

          const [chamCongData] = await db.execute(
            "SELECT COUNT(*) AS so_cong FROM chamcong WHERE ma_nhanvien = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?",
            [ma_nhanvien, thang, nam]
          );

          const so_cong = chamCongData[0]?.so_cong || 0;
          const tong_luong = (luong_cb / 26) * so_cong;

          await db.execute(
            `INSERT INTO luong (ma_nhanvien, thang, nam, luong_cb, so_cong, tong_luong)
   VALUES (?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE 
     luong_cb = VALUES(luong_cb),
     so_cong = VALUES(so_cong),
     tong_luong = VALUES(tong_luong)`,
            [ma_nhanvien, thang, nam, luong_cb, so_cong, tong_luong]
          );

          danhSachLuong.push({
            ma_nhanvien,
            luong_cb,
            so_cong,
            tong_luong: `${tong_luong.toFixed(0)} VNĐ`,
          });
        }

        res.status(201).json({
          message: "Bảng lương đã được tính và lưu thành công.",
          du_lieu: danhSachLuong,
        });
      } catch (err) {
        console.error("Lỗi khi lưu bảng lương:", err);
        res.status(500).json({ error: "Lỗi server", details: err.message });
      }
    });

    app.post("/xuat-luong", async (req, res) => {
      try {
        const { role, ma_nhanvien, ma_phongban, thang, nam, ten } = req.body;

        if (!thang || !nam) {
          return res.status(400).json({ error: "Vui lòng chọn tháng và năm." });
        }

        if (!role) {
          return res.status(400).json({ error: "Thiếu thông tin vai trò." });
        }

        //Tự động tính lại bảng lương trước khi xuất (nếu là admin hoặc quản lý)
        if (role === "admin" || role === "quan ly") {
          const [nhanVienList] = await db.execute(
            "SELECT ma_nhanvien, luong_cb FROM nhanvien"
          );
          for (const { ma_nhanvien, luong_cb } of nhanVienList) {
            const [chamCongData] = await db.execute(
              `SELECT COUNT(*) AS so_cong FROM chamcong 
           WHERE ma_nhanvien = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?`,
              [ma_nhanvien, thang, nam]
            );

            const so_cong = chamCongData[0]?.so_cong || 0;
            const tong_luong = (parseFloat(luong_cb) / 26) * so_cong;

            await db.execute(
              `INSERT INTO luong (ma_nhanvien, thang, nam, luong_cb, so_cong, tong_luong)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             luong_cb = VALUES(luong_cb),
             so_cong = VALUES(so_cong),
             tong_luong = VALUES(tong_luong)`,
              [ma_nhanvien, thang, nam, luong_cb, so_cong, tong_luong]
            );
          }
        }

        //Truy vấn dữ liệu để xuất Excel
        let query = `
      SELECT 
        nv.ma_nhanvien, nv.ho, nv.ten, 
        nv.ma_phongban, pb.ten_phongban, 
        cv.ten_chucvu, 
        l.thang, l.nam,
        l.so_cong, l.luong_cb, l.tong_luong
      FROM luong l
      JOIN nhanvien nv ON l.ma_nhanvien = nv.ma_nhanvien
      JOIN phongban pb ON nv.ma_phongban = pb.ma_phongban
      JOIN chucvu cv ON nv.ma_chucvu = cv.ma_chucvu
      WHERE l.thang = ? AND l.nam = ?
    `;
        const params = [thang, nam];

        if (role === "nhan_vien") {
          if (!ma_nhanvien)
            return res.status(400).json({ error: "Thiếu mã nhân viên." });
          query += " AND nv.ma_nhanvien = ?";
          params.push(ma_nhanvien);
        } else if (role === "quan ly") {
          if (!ma_phongban)
            return res.status(400).json({ error: "Thiếu mã phòng ban." });
          query += " AND nv.ma_phongban = ?";
          params.push(ma_phongban);
        } else if (
          role === "admin" &&
          req.body.loc_theo_ma_nhanvien &&
          ma_nhanvien
        ) {
          query += " AND nv.ma_nhanvien = ?";
          params.push(ma_nhanvien);
        }

        const [rows] = await db.execute(query, params);

        //Tạo file Excel
        const ExcelJS = require("exceljs");
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("BangLuong");

        let currentRow = 1;

        // Thông tin người tạo file
        if (role !== "nhan_vien") {
          const now = new Date().toLocaleString("vi-VN");

          worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
          worksheet.getCell(
            `A${currentRow}`
          ).value = `Người tạo file bảng lương`;
          worksheet.getCell(`A${currentRow}`).font = {
            bold: true,
            color: { argb: "FF0000" },
          };
          worksheet.getCell(`A${currentRow}`).alignment = {
            vertical: "middle",
            horizontal: "left",
          };
          currentRow++;

          worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
          worksheet.getCell(
            `A${currentRow}`
          ).value = `Thời gian tạo file: ${now}`;
          worksheet.getCell(`A${currentRow}`).font = {
            italic: true,
            color: { argb: "666666" },
          };
          worksheet.getCell(`A${currentRow}`).alignment = {
            vertical: "middle",
            horizontal: "left",
          };
          currentRow++;

          worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
          worksheet.getCell(
            `A${currentRow}`
          ).value = `Tạo bởi: ${ten} (${req.body.ma_nhanvien})`;
          worksheet.getCell(`A${currentRow}`).font = {
            italic: true,
            color: { argb: "0000FF" },
          };
          worksheet.getCell(`A${currentRow}`).alignment = {
            vertical: "middle",
            horizontal: "left",
          };
          currentRow++;

          worksheet.addRow([]);
          currentRow++;
        }

        // Tiêu đề bảng
        worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
        worksheet.getCell(
          `A${currentRow}`
        ).value = `BẢNG LƯƠNG THÁNG ${thang}/${nam}`;
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        worksheet.getCell(`A${currentRow}`).alignment = {
          horizontal: "center",
        };
        currentRow++;

        worksheet.addRow([]);
        currentRow++;

        // Cấu trúc cột
        worksheet.columns = [
          { header: "Mã nhân viên", key: "ma_nhanvien", width: 15 },
          { header: "Họ", key: "ho", width: 20 },
          { header: "Tên", key: "ten", width: 20 },
          { header: "Mã phòng ban", key: "ma_phongban", width: 15 },
          { header: "Phòng ban", key: "ten_phongban", width: 20 },
          { header: "Chức vụ", key: "ten_chucvu", width: 20 },
          { header: "Tháng", key: "thang", width: 10 },
          { header: "Năm", key: "nam", width: 10 },
          { header: "Số công", key: "so_cong", width: 10 },
          { header: "Lương cơ bản", key: "luong_cb", width: 15 },
          { header: "Tổng lương", key: "tong_luong", width: 20 },
        ];

        // Header
        worksheet.addRow(worksheet.columns.map((c) => c.header));
        worksheet.getRow(currentRow).font = { bold: true };
        worksheet.getRow(currentRow).alignment = { horizontal: "center" };
        currentRow++;

        // Dữ liệu lương
        rows.forEach((row) => {
          worksheet.addRow(row);
        });

        // Định dạng số tiền thành VND
        worksheet.getColumn("luong_cb").numFmt = '#,##0 "VNĐ"';
        worksheet.getColumn("tong_luong").numFmt = '#,##0 "VNĐ"';

        // Định dạng
        worksheet.getColumn("luong_cb").numFmt = "#,##0";
        worksheet.getColumn("tong_luong").numFmt = "#,##0";

        // Viền và căn giữa
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
              wrapText: true,
            };
          });
        });
        // Ghi log
        if (role === "admin" || role === "quan ly") {
          await logAudit(db, {
            actionType: "EXPORT",
            tableName: "luong",
            performedBy: req.body.ma_nhanvien || "unknown",
            recordId: null,
            changes: {
              thang,
              nam,
              nguoi_xuat: `${req.body.ten} (${req.body.ma_nhanvien})`,
              chuc_vu: role === "admin" ? "Admin" : "Quản lý",
            },
          });
        }

        // Trả file về
        const fileName = `bang_luong_${thang}_${nam}.xlsx`;
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        await workbook.xlsx.write(res);
        res.end();
      } catch (err) {
        console.error("Lỗi xuất Excel:", err);
        res.status(500).json({ error: "Lỗi khi xuất Excel" });
      }
    });
    // API: Lấy danh sách mã + tên nhân viên tùy theo vai trò
    app.post("/dsnhanvien-tinhluong", async (req, res) => {
      try {
        const { role, ma_phongban } = req.body;

        if (!role) {
          return res.status(400).json({ error: "Thiếu thông tin vai trò." });
        }

        let query = "SELECT ma_nhanvien, ho, ten FROM nhanvien";
        let params = [];

        if (role === "quan ly") {
          if (!ma_phongban)
            return res.status(400).json({ error: "Thiếu mã phòng ban." });

          query += " WHERE ma_phongban = ?";
          params.push(ma_phongban);
        } else if (role === "nhan_vien") {
          // Không cho phép truy xuất danh sách
          return res
            .status(403)
            .json({ error: "Không có quyền truy cập danh sách." });
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách nhân viên:", err);
        res.status(500).json({ error: "Lỗi server", details: err.message });
      }
    });

    app.listen(5012, () => {
      console.log("Server đang chạy tại http://localhost:5012");
    });
  } catch (err) {
    console.error("Không thể khởi động server do lỗi MySQL:", err);
  }
}

startServer();
