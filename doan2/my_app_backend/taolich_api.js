const express = require("express");
const cors = require("cors");
const ketNoiCSDL = require("./db");
const logAudit = require("./utils/auditLog");

const app = express();
app.use(cors());
app.use(express.json());

let csdl;

async function khoiDongMayChu() {
  try {
    csdl = await ketNoiCSDL();

    // Lấy danh sách nhân viên theo phòng ban
    app.get("/dsnhanvien", async (req, res) => {
      const { ma_phongban } = req.query;
      try {
        const [rows] = await csdl.query(
          "SELECT * FROM nhanvien WHERE ma_phongban = ?",
          [ma_phongban]
        );
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Không thể lấy danh sách nhân viên." });
      }
    });

    // Thêm lịch làm việc thủ công
    app.post("/lichlamviec", async (req, res) => {
      try {
        const { lichLamViec, performedBy } = req.body;
        const lichDaThem = [];

        for (const ngay of Object.keys(lichLamViec)) {
          for (const ca of Object.keys(lichLamViec[ngay])) {
            const danhSachNhanVien = lichLamViec[ngay][ca];

            for (const maNV of danhSachNhanVien) {
              const [existing] = await csdl.query(
                "SELECT * FROM work_schedule WHERE ma_nhanvien = ? AND day_of_week = ? AND shift = ?",
                [maNV, ngay, ca]
              );

              if (existing.length === 0) {
                let start_time = "08:00:00",
                  end_time = "12:00:00";
                if (ca === "Chiều") {
                  start_time = "13:00:00";
                  end_time = "17:00:00";
                } else if (ca === "Tối") {
                  start_time = "18:00:00";
                  end_time = "22:00:00";
                }
                const ngayMap = {
                  "Thứ 2": "Thứ 2",
                  "Thứ 3": "Thứ 3",
                  "Thứ 4": "Thứ 4",
                  "Thứ 5": "Thứ 5",
                  "Thứ 6": "Thứ 6",
                  "Thứ 7": "Thứ 7",
                  "Chủ nhật": "Chủ nhật",
                };

                const ngayLuu = ngayMap[ngay] || ngay;

                await csdl.execute(
                  "INSERT INTO work_schedule (ma_nhanvien, day_of_week, shift, start_time, end_time) VALUES (?, ?, ?, ?, ?)",
                  [maNV, ngayLuu, ca, start_time, end_time]
                );

                lichDaThem.push({ ma_nhanvien: maNV, ngay, ca });
              }
            }
          }
        }

        const actor = {
          ma: performedBy?.ma || "unknown",
          ten: performedBy?.ten || "Không rõ",
          chucvu: performedBy?.chucvu || "Không rõ",
          phongban: performedBy?.phongban || "Không rõ",
        };

        await logAudit(csdl, {
          actionType: "Thêm lịch thủ công",
          tableName: "work_schedule",
          performedBy: actor.ma,
          recordId: null,
          changes: {
            loai: "lich_thu_cong",
            ten: actor.ten,
            ma: actor.ma,
            chucvu: actor.chucvu,
            phongban: actor.phongban,
            thaydoi: lichDaThem,
          },
        });

        res.status(201).json({ message: "Lịch làm việc đã được cập nhật!" });
      } catch (loi) {
        console.error("Lỗi khi thêm lịch làm việc:", loi);
        res.status(500).json({ error: "Lỗi khi thêm lịch làm việc" });
      }
    });

    app.get("/xemlichlamviec", async (req, res) => {
      try {
        const [rows] = await csdl.query(`
      SELECT 
        ws.ma_nhanvien, 
        nv.ho, 
        nv.ten, 
        TRIM(
          CASE ws.day_of_week
            WHEN 'Thứ 2' THEN 'Thứ 2'
            WHEN 'Thứ 3' THEN 'Thứ 3'
            WHEN 'Thứ 4' THEN 'Thứ 4'
            WHEN 'Thứ 5' THEN 'Thứ 5'
            WHEN 'Thứ 6' THEN 'Thứ 6'
            WHEN 'Thứ 7' THEN 'Thứ 7'
            WHEN 'Chủ nhật' THEN 'Chủ nhật'
            ELSE ws.day_of_week
          END
        ) AS day_of_week,
        CASE 
          WHEN ws.shift LIKE 'Sáng%' THEN 'Sáng'
          WHEN ws.shift LIKE 'Chiều%' THEN 'Chiều'
          WHEN ws.shift LIKE 'Tối%' THEN 'Tối'
          ELSE ws.shift
        END AS shift,
        ws.start_time, 
        ws.end_time, 
        ws.ghi_chu
      FROM work_schedule ws
      JOIN nhanvien nv ON ws.ma_nhanvien = nv.ma_nhanvien
      ORDER BY 
        FIELD(TRIM(ws.day_of_week), 'Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'),
        FIELD(
          CASE 
            WHEN ws.shift LIKE 'Sáng%' THEN 'Sáng'
            WHEN ws.shift LIKE 'Chiều%' THEN 'Chiều'
            WHEN ws.shift LIKE 'Tối%' THEN 'Tối'
          END, 
          'Sáng', 'Chiều', 'Tối'
        )
    `);

        res.json(rows);
      } catch (loi) {
        console.error("Lỗi khi lấy lịch làm việc:", loi);
        res.status(500).json({ error: "Lỗi khi lấy lịch làm việc" });
      }
    });

    // API: Tạo lịch làm việc tự động
    app.post("/tao-lich-tu-dong", async (req, res) => {
      try {
        const { ma_phongban, performedBy } = req.body;

        // Lấy danh sách nhân viên của phòng ban
        const [dsNhanVien] = await csdl.query(
          "SELECT ma_nhanvien FROM nhanvien WHERE ma_phongban = ?",
          [ma_phongban]
        );

        if (dsNhanVien.length === 0) {
          return res
            .status(400)
            .json({ error: "Không có nhân viên trong phòng ban" });
        }

        // Lấy lịch đã có để tránh gán trùng
        const [lichHienCo] = await csdl.query(
          "SELECT ma_nhanvien, day_of_week, shift FROM work_schedule"
        );

        // Tạo map để check nhanh
        const daCoLich = new Set(
          lichHienCo.map((l) => `${l.ma_nhanvien}_${l.day_of_week}_${l.shift}`)
        );

        const lichTuDong = {};
        const ngayTrongTuan = [
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "Chủ nhật",
        ];
        const caLamViec = ["Sáng", "Chiều", "Tối"];

        let index = 0;
        for (const ngay of ngayTrongTuan) {
          lichTuDong[ngay] = {};

          for (const ca of caLamViec) {
            const danhSachCa = [];

            // Lặp qua danh sách NV và chọn 2 người không trùng
            let soNguoiChon = 0;
            let loopCount = 0; // chống vòng lặp vô tận
            while (soNguoiChon < 2 && loopCount < dsNhanVien.length * 2) {
              const nv = dsNhanVien[index % dsNhanVien.length].ma_nhanvien;
              index++;
              loopCount++;

              const key = `${nv}_${ngay}_${ca}`;
              if (!danhSachCa.includes(nv) && !daCoLich.has(key)) {
                danhSachCa.push(nv);
                daCoLich.add(key); // Đánh dấu là đã có lịch
                soNguoiChon++;
              }
            }

            lichTuDong[ngay][ca] = danhSachCa;

            // Xác định giờ bắt đầu/kết thúc
            let start_time = "08:00:00",
              end_time = "12:00:00";
            if (ca === "Chiều") {
              start_time = "13:00:00";
              end_time = "17:00:00";
            } else if (ca === "Tối") {
              start_time = "18:00:00";
              end_time = "22:00:00";
            }

            // Lưu vào DB
            for (const maNV of danhSachCa) {
              await csdl.execute(
                "INSERT INTO work_schedule (ma_nhanvien, day_of_week, shift, start_time, end_time) VALUES (?, ?, ?, ?, ?)",
                [maNV, ngay, ca, start_time, end_time]
              );
            }
          }
        }

        const actor = {
          ma: performedBy?.ma || "unknown",
          ten: performedBy?.ten || "Không rõ",
          chucvu: performedBy?.chucvu || "Không rõ",
          phongban: performedBy?.phongban || "Không rõ",
        };

        await logAudit(csdl, {
          actionType: "Tạo lịch tự động",
          tableName: "work_schedule",
          performedBy: actor.ma,
          recordId: null,
          changes: {
            loai: "lich_tu_dong",
            ten: actor.ten,
            ma: actor.ma,
            chucvu: actor.chucvu,
            phongban: actor.phongban,
            thaydoi: lichTuDong,
          },
        });

        res.json({
          message: "Tạo lịch tự động và lưu thành công!",
          lichTuDong,
        });
      } catch (err) {
        console.error("Lỗi tạo lịch tự động:", err);
        res.status(500).json({ error: "Không thể tạo lịch tự động" });
      }
    });

    app.listen(5002, () => {
      console.log("Máy chủ đang chạy tại http://localhost:5002");
    });
  } catch (loi) {
    console.error("Không thể khởi động máy chủ do lỗi MySQL:", loi);
  }
}

khoiDongMayChu();
