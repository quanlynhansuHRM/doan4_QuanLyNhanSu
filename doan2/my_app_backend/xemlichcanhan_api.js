const express = require("express");
const cors = require("cors");
const ketNoiCSDL = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

let csdl;

async function khoiDongMayChu() {
  try {
    csdl = await ketNoiCSDL();

    app.get("/xemlichlamvieccanhan/:ma_nhanvien", async (req, res) => {
      try {
        const { ma_nhanvien } = req.params;
        if (!ma_nhanvien) {
          return res.status(400).json({ error: "Thiếu mã nhân viên" });
        }

        const [rows] = await csdl.query(
          `SELECT ws.ma_nhanvien, nv.ho, nv.ten, ws.day_of_week, ws.shift, ws.ghi_chu
   FROM work_schedule ws
   JOIN nhanvien nv ON ws.ma_nhanvien = nv.ma_nhanvien
   WHERE ws.ma_nhanvien = ?`,
          [ma_nhanvien]
        );

        res.json(rows);
      } catch (loi) {
        console.error(loi);
        res.status(500).json({ error: "Lỗi khi lấy lịch làm việc" });
      }
    });

    app.listen(5010, () => {
      console.log("Máy chủ đang chạy tại http://localhost:5010");
    });
  } catch (loi) {
    console.error("Không thể khởi động máy chủ do lỗi MySQL");
  }
}

khoiDongMayChu();
