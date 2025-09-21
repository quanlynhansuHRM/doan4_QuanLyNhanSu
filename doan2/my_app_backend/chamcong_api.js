const express = require("express");
const cors = require("cors");
const dayjs = require("dayjs");
require("dayjs/locale/vi");
const connectDB = require("./db");
dayjs.locale("vi");

const app = express();
app.use(cors());
app.use(express.json());

function normalizeRole(role) {
  if (!role) return null;
  return String(role).toLowerCase().replace(/\s+/g, "");
}
function getUserFromHeader(req) {
  const ma_nhanvien = req.headers["x-ma-nhanvien"];
  const roleRaw = req.headers["x-role"];
  const role = normalizeRole(roleRaw);
  if (!ma_nhanvien || !role) return null;
  return { ma_nhanvien, role };
}
function requireRole(roles = []) {
  const normalized = roles.map(normalizeRole);
  return (req, res, next) => {
    const user = getUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Chưa xác thực" });
    if (!normalized.includes(user.role)) {
      return res
        .status(403)
        .json({ error: "Không có quyền thực hiện hành động này." });
    }
    req.user = user;
    next();
  };
}
function normalizeTimeString(t) {
  if (!t) return null;
  if (/^\d{1,2}:\d{2}$/.test(t)) return t.length === 4 ? `0${t}:00` : `${t}:00`;
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) return t.length === 7 ? `0${t}` : t;
  return null;
}
function toSec(t) {
  if (!t) return null;
  const [H, M, S] = t.split(":").map(Number);
  return H * 3600 + M * 60 + (S || 0);
}
function calcLateEarly({ start_time, end_time, check_in, check_out }) {
  const st = toSec(start_time);
  const et = toSec(end_time);
  const ci = toSec(check_in);
  const co = toSec(check_out);
  let late = 0;
  let early = 0;
  if (st != null && ci != null && ci > st) {
    late = Math.round((ci - st) / 60);
  }
  if (et != null && co != null && co < et) {
    early = Math.round((et - co) / 60);
  }
  let status = null;
  if (check_in == null && check_out == null) status = null;
  else if (late > 0 && early > 0) status = "Trễ+Sớm";
  else if (late > 0) status = "Đi trễ";
  else if (early > 0) status = "Về sớm";
  else status = "Đúng giờ";
  return { late_minutes: late, early_minutes: early, status };
}

// bản đồ thứ
const thuMap = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

// in-memory flag auto mode (true/false)
let autoMode = false;

async function startServer() {
  try {
    const db = await connectDB();
    // Lấy danh sách nhân viên theo phòng ban
    app.get(
      "/nhanvien/dropdown",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const user = getUserFromHeader(req);
          let query = `
        SELECT ma_nhanvien, ho, ten, ma_phongban, ma_chucvu
        FROM nhanvien
        WHERE trang_thai = 1
      `;
          let params = [];

          // Nếu là quản lý thì chỉ lấy nhân viên cùng phòng ban
          if (user.role === "quanly") {
            query +=
              " AND ma_phongban = (SELECT ma_phongban FROM nhanvien WHERE ma_nhanvien = ?)";
            params.push(user.ma_nhanvien);
          }

          const [rows] = await db.execute(query, params);
          res.json(rows);
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Lỗi khi lấy danh sách nhân viên" });
        }
      }
    );
    // Ghi chú chấm công
    // body: { ma_nhanvien, ngay (YYYY-MM-DD), shift, check_in, check_out, ghi_chu }
    app.post(
      "/chamcong/ghichu",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const { ma_nhanvien, ngay, shift } = req.body;
          let { check_in, check_out, ghi_chu } = req.body;

          if (!ma_nhanvien || !ngay || !shift) {
            return res
              .status(400)
              .json({ error: "Thiếu ma_nhanvien/ngay/shift" });
          }

          const ci = check_in ? normalizeTimeString(check_in) : null;
          const co = check_out ? normalizeTimeString(check_out) : null;

          const [exist] = await db.execute(
            "SELECT id, start_time, end_time FROM chamcong WHERE ma_nhanvien = ? AND ngay = ? AND shift = ?",
            [ma_nhanvien, ngay, shift]
          );

          if (exist.length > 0) {
            const { late_minutes, early_minutes, status } = calcLateEarly({
              start_time: exist[0].start_time,
              end_time: exist[0].end_time,
              check_in: ci ?? exist[0].check_in,
              check_out: co ?? exist[0].check_out,
            });
            await db.execute(
              "UPDATE chamcong SET check_in = ?, check_out = ?, ghi_chu = ?, late_minutes=?, early_minutes=?, status=? WHERE id = ?",
              [
                ci,
                co,
                ghi_chu || "",
                late_minutes,
                early_minutes,
                status,
                exist[0].id,
              ]
            );
          } else {
            // lấy giờ từ work_schedule
            const dayOfWeek = thuMap[dayjs(ngay).day()];
            const [sch] = await db.execute(
              "SELECT start_time, end_time FROM work_schedule WHERE ma_nhanvien=? AND day_of_week=? AND shift=?",
              [ma_nhanvien, dayOfWeek, shift]
            );
            const start_time = sch[0]?.start_time || null;
            const end_time = sch[0]?.end_time || null;
            const { late_minutes, early_minutes, status } = calcLateEarly({
              start_time,
              end_time,
              check_in: ci,
              check_out: co,
            });
            await db.execute(
              `INSERT INTO chamcong (ma_nhanvien, ngay, shift, check_in, check_out, ghi_chu, start_time, end_time, late_minutes, early_minutes, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                ma_nhanvien,
                ngay,
                shift,
                ci,
                co,
                ghi_chu || "",
                start_time,
                end_time,
                late_minutes,
                early_minutes,
                status,
              ]
            );
          }

          return res.json({ message: "Ghi nhận chấm công đã được lưu." });
        } catch (err) {
          console.error("POST /chamcong/ghichu error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // --- POST /chamcong-auto/run  (admin/quanly) ---
    app.post(
      "/chamcong-auto/run",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const ngay = req.body.ngay || dayjs().format("YYYY-MM-DD");
          const dayOfWeek = thuMap[dayjs(ngay).day()];

          const [schedules] = await db.execute(
            "SELECT id, ma_nhanvien, day_of_week, shift, start_time, end_time FROM work_schedule WHERE day_of_week = ?",
            [dayOfWeek]
          );

          if (!schedules || schedules.length === 0) {
            return res.status(200).json({
              message: "Không có lịch cho ngày này.",
              inserted: 0,
              skipped: 0,
              errors: [],
            });
          }

          let inserted = 0;
          let skipped = 0;
          const errors = [];

          for (const sch of schedules) {
            const ma_nhanvien = sch.ma_nhanvien;
            const shift = sch.shift;

            const [leaveRows] = await db.execute(
              `SELECT id FROM don_xin_nghi_phep 
               WHERE ma_nhanvien = ? 
                 AND ngay_nghi = ? 
                 AND trang_thai = 'Đã duyệt' 
                 AND (nghi_ca_hay_ngay = 'Cả ngày' OR ca_nghi = ?)`,
              [ma_nhanvien, ngay, shift]
            );
            if (leaveRows.length > 0) {
              skipped++;
              continue;
            }

            const start_time = sch.start_time;
            const end_time = sch.end_time;
            if (!start_time || !end_time) {
              errors.push({
                ma_nhanvien,
                shift,
                reason: "Thiếu start_time hoặc end_time trong work_schedule",
              });
              continue;
            }

            const [existing] = await db.execute(
              "SELECT id FROM chamcong WHERE ma_nhanvien = ? AND ngay = ? AND shift = ?",
              [ma_nhanvien, ngay, shift]
            );
            if (existing.length > 0) {
              skipped++;
              continue;
            }

            await db.execute(
              `INSERT INTO chamcong (ma_nhanvien, ngay, shift, check_in, check_out, ghi_chu, start_time, end_time)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                ma_nhanvien,
                ngay,
                shift,
                start_time,
                end_time,
                "",
                start_time,
                end_time,
              ]
            );
            inserted++;
          }

          return res.status(201).json({
            message: "Tạo chấm công tự động hoàn tất",
            inserted,
            skipped,
            errors,
          });
        } catch (err) {
          console.error("POST /chamcong-auto/run error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // --- POST /chamcong-auto/toggle  (admin/quanly) ---
    app.post(
      "/chamcong-auto/toggle",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const { enabled } = req.body;
          autoMode = !!enabled;
          return res.json({
            message: `Auto mode ${autoMode ? "bật" : "tắt"}`,
            autoMode,
          });
        } catch (err) {
          console.error("POST /chamcong-auto/toggle error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // --- GET /chamcong-auto/status (admin/quanly) ---
    app.get(
      "/chamcong-auto/status",
      requireRole(["admin", "quanly"]),
      (req, res) => {
        res.json({ autoMode });
      }
    );

    // --- POST /chamcong/checkin  (nhân viên) ---
    app.post("/chamcong/checkin", async (req, res) => {
      try {
        const user = getUserFromHeader(req);
        if (!user) return res.status(401).json({ error: "Chưa xác thực" });

        const { shift } = req.body;
        if (!shift) return res.status(400).json({ error: "Thiếu shift" });

        const ngay = dayjs().format("YYYY-MM-DD");
        const dayOfWeek = thuMap[dayjs().day()];

        const [schedule] = await db.execute(
          "SELECT start_time, end_time FROM work_schedule WHERE ma_nhanvien = ? AND day_of_week = ? AND shift = ?",
          [user.ma_nhanvien, dayOfWeek, shift]
        );
        if (!schedule.length) {
          return res
            .status(400)
            .json({ error: "Không có lịch làm cho ca này" });
        }

        const [leaveRows] = await db.execute(
          `SELECT id FROM don_xin_nghi_phep WHERE ma_nhanvien = ? AND ngay_nghi = ? AND trang_thai = 'Đã duyệt' AND (nghi_ca_hay_ngay = 'Cả ngày' OR ca_nghi = ?)`,
          [user.ma_nhanvien, ngay, shift]
        );
        if (leaveRows.length > 0)
          return res.status(400).json({ error: "Đã có đơn nghỉ đã duyệt" });

        const start_time = schedule[0].start_time;
        const end_time = schedule[0].end_time;
        const [existing] = await db.execute(
          "SELECT id FROM chamcong WHERE ma_nhanvien = ? AND ngay = ? AND shift = ?",
          [user.ma_nhanvien, ngay, shift]
        );
        const now = dayjs().format("HH:mm:ss");
        if (existing.length > 0) {
          return res
            .status(400)
            .json({ error: "Đã có bản ghi chấm công cho ca này" });
        }

        await db.execute(
          `INSERT INTO chamcong (ma_nhanvien, ngay, shift, check_in, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)`,
          [user.ma_nhanvien, ngay, shift, now, start_time, end_time]
        );

        return res.json({ message: "Check-in thành công", check_in: now });
      } catch (err) {
        console.error("POST /chamcong/checkin error:", err);
        return res
          .status(500)
          .json({ error: "Lỗi server", details: err.message });
      }
    });

    // --- PUT /chamcong/checkout/:id  (nhân viên) ---
    app.put("/chamcong/checkout/:id", async (req, res) => {
      try {
        const user = getUserFromHeader(req);
        if (!user) return res.status(401).json({ error: "Chưa xác thực" });

        const id = req.params.id;
        const [rows] = await db.execute(
          "SELECT * FROM chamcong WHERE id = ? AND ma_nhanvien = ?",
          [id, user.ma_nhanvien]
        );
        if (!rows.length)
          return res.status(404).json({ error: "Không tìm thấy bản ghi" });

        const now = dayjs().format("HH:mm:ss");

        const { late_minutes, early_minutes, status } = calcLateEarly({
          start_time: rows[0].start_time,
          end_time: rows[0].end_time,
          check_in: rows[0].check_in,
          check_out: now,
        });

        await db.execute(
          "UPDATE chamcong SET check_out = ?, late_minutes=?, early_minutes=?, status=? WHERE id = ?",
          [now, late_minutes, early_minutes, status, id]
        );

        return res.json({ message: "Check-out thành công", check_out: now });
      } catch (err) {
        console.error("PUT /chamcong/checkout error:", err);
        return res
          .status(500)
          .json({ error: "Lỗi server", details: err.message });
      }
    });

    // --- GET /chamcong?ngay=...  (admin/quanly) ---
    app.get("/chamcong", requireRole(["admin", "quanly"]), async (req, res) => {
      try {
        const ngay = req.query.ngay || dayjs().format("YYYY-MM-DD");
        const [rows] = await db.execute(
          "SELECT * FROM chamcong WHERE ngay = ? ORDER BY ma_nhanvien, shift",
          [ngay]
        );
        return res.json({ ngay, data: rows });
      } catch (err) {
        console.error("GET /chamcong error:", err);
        return res
          .status(500)
          .json({ error: "Lỗi server", details: err.message });
      }
    });

    // --- GET /chamcong/me (nhân viên) ---
    app.get("/chamcong/me", async (req, res) => {
      try {
        const user = getUserFromHeader(req);
        if (!user) return res.status(401).json({ error: "Chưa xác thực" });
        const ngay = req.query.ngay || dayjs().format("YYYY-MM-DD");
        const [rows] = await db.execute(
          "SELECT * FROM chamcong WHERE ma_nhanvien = ? AND ngay = ? ORDER BY shift",
          [user.ma_nhanvien, ngay]
        );
        return res.json({ ngay, data: rows });
      } catch (err) {
        console.error("GET /chamcong/me error:", err);
        return res
          .status(500)
          .json({ error: "Lỗi server", details: err.message });
      }
    });

    // --- PUT /chamcong/:id (admin/quanly) cập nhật đơn lẻ ---
    app.put(
      "/chamcong/:id",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const id = req.params.id;
          const { check_in, check_out, ghi_chu } = req.body;

          const [rows] = await db.execute(
            "SELECT * FROM chamcong WHERE id = ?",
            [id]
          );
          if (!rows || rows.length === 0)
            return res
              .status(404)
              .json({ error: "Không tìm thấy bản ghi chấm công." });

          const original = rows[0];

          const ci = check_in
            ? normalizeTimeString(check_in)
            : original.check_in;
          const co = check_out
            ? normalizeTimeString(check_out)
            : original.check_out;
          if ((check_in && !ci) || (check_out && !co)) {
            return res.status(400).json({
              error: "Định dạng giờ không hợp lệ. Sử dụng HH:mm hoặc HH:mm:ss",
            });
          }

          const { late_minutes, early_minutes, status } = calcLateEarly({
            start_time: original.start_time,
            end_time: original.end_time,
            check_in: ci,
            check_out: co,
          });

          await db.execute(
            "UPDATE chamcong SET check_in = ?, check_out = ?, ghi_chu = ?, late_minutes=?, early_minutes=?, status=? WHERE id = ?",
            [
              ci,
              co,
              ghi_chu ?? original.ghi_chu,
              late_minutes,
              early_minutes,
              status,
              id,
            ]
          );

          return res.json({ message: "Cập nhật chấm công thành công." });
        } catch (err) {
          console.error("PUT /chamcong/:id error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // ====== QUẢN LÝ THEO CA ======

    // --- GET /chamcong/shift?ngay=YYYY-MM-DD&shift=Sáng|Chiều|Tối
    app.get(
      "/chamcong/shift",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const ngay = req.query.ngay;
          const shift = req.query.shift;
          if (!ngay || !shift) {
            return res.status(400).json({ error: "Thiếu ngay/shift" });
          }
          const dayOfWeek = thuMap[dayjs(ngay).day()];

          // Chỉ lấy nhân sự trong phòng ban nếu là quản lý
          let schQuery = `
        SELECT ws.ma_nhanvien, ws.shift, ws.start_time, ws.end_time,
               nv.ho, nv.ten, nv.ma_phongban, nv.ma_chucvu
        FROM work_schedule ws
        JOIN nhanvien nv ON nv.ma_nhanvien = ws.ma_nhanvien
        WHERE ws.day_of_week = ? AND ws.shift = ? AND nv.trang_thai = 1
      `;
          let schParams = [dayOfWeek, shift];

          if (req.user.role === "quanly") {
            schQuery += ` AND nv.ma_phongban = (
          SELECT ma_phongban FROM nhanvien WHERE ma_nhanvien = ?
        )`;
            schParams.push(req.user.ma_nhanvien);
          }

          const [sch] = await db.execute(schQuery, schParams);

          if (sch.length === 0) {
            return res.json({ ngay, shift, scheduled: 0, data: [] });
          }

          const [leaves] = await db.execute(
            `SELECT ma_nhanvien
           FROM don_xin_nghi_phep
          WHERE ngay_nghi = ?
            AND trang_thai = 'Đã duyệt'
            AND (nghi_ca_hay_ngay = 'Cả ngày' OR ca_nghi = ?)`,
            [ngay, shift]
          );
          const leaveSet = new Set(leaves.map((l) => l.ma_nhanvien));

          const [att] = await db.execute(
            `SELECT * FROM chamcong WHERE ngay = ? AND shift = ?`,
            [ngay, shift]
          );
          const attMap = new Map();
          att.forEach((r) => attMap.set(r.ma_nhanvien, r));

          const rows = sch.map((r) => {
            const cc = attMap.get(r.ma_nhanvien) || null;
            return {
              ma_nhanvien: r.ma_nhanvien,
              ho: r.ho,
              ten: r.ten,
              ma_phongban: r.ma_phongban,
              ma_chucvu: r.ma_chucvu,
              shift: r.shift,
              start_time: r.start_time,
              end_time: r.end_time,
              leave_approved: leaveSet.has(r.ma_nhanvien),
              chamcong: cc,
            };
          });

          return res.json({
            ngay,
            shift,
            scheduled: rows.length,
            data: rows,
          });
        } catch (err) {
          console.error("GET /chamcong/shift error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // POST /chamcong/bulk-create { ngay, shift }
    app.post(
      "/chamcong/bulk-create",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const { ngay, shift } = req.body;
          if (!ngay || !shift) {
            return res.status(400).json({ error: "Thiếu ngay/shift" });
          }
          const dayOfWeek = thuMap[dayjs(ngay).day()];

          const [schedules] = await db.execute(
            `SELECT ws.ma_nhanvien, ws.start_time, ws.end_time
               FROM work_schedule ws
               JOIN nhanvien nv ON nv.ma_nhanvien = ws.ma_nhanvien
              WHERE ws.day_of_week = ? AND ws.shift = ? AND nv.trang_thai = 1`,
            [dayOfWeek, shift]
          );

          if (!schedules.length) {
            return res.json({
              message: "Không có lịch cho ca này",
              inserted: 0,
              skipped: 0,
            });
          }

          const [leaves] = await db.execute(
            `SELECT ma_nhanvien
               FROM don_xin_nghi_phep
              WHERE ngay_nghi = ?
                AND trang_thai = 'Đã duyệt'
                AND (nghi_ca_hay_ngay = 'Cả ngày' OR ca_nghi = ?)`,
            [ngay, shift]
          );
          const leaveSet = new Set(leaves.map((l) => l.ma_nhanvien));

          let inserted = 0;
          let skipped = 0;

          for (const sch of schedules) {
            if (leaveSet.has(sch.ma_nhanvien)) {
              skipped++;
              continue;
            }
            const [exist] = await db.execute(
              `SELECT id FROM chamcong WHERE ma_nhanvien = ? AND ngay = ? AND shift = ?`,
              [sch.ma_nhanvien, ngay, shift]
            );
            if (exist.length) {
              skipped++;
              continue;
            }
            await db.execute(
              `INSERT INTO chamcong (ma_nhanvien, ngay, shift, start_time, end_time, ghi_chu, status)
               VALUES (?, ?, ?, ?, ?, '', NULL)`,
              [sch.ma_nhanvien, ngay, shift, sch.start_time, sch.end_time]
            );
            inserted++;
          }

          return res.status(201).json({
            message: "Tạo bản ghi chấm công theo ca hoàn tất",
            inserted,
            skipped,
          });
        } catch (err) {
          console.error("POST /chamcong/bulk-create error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // PUT /chamcong/bulk-update
    // body: { ngay, shift, updates: [{ id OR ma_nhanvien, check_in, check_out, ghi_chu }] }
    app.put(
      "/chamcong/bulk-update",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const { ngay, shift, updates } = req.body;
          if (!ngay || !shift || !Array.isArray(updates)) {
            return res.status(400).json({ error: "Thiếu ngay/shift/updates" });
          }

          let updated = 0;
          for (const u of updates) {
            const keyClause = u.id
              ? "id = ?"
              : "(ma_nhanvien = ? AND ngay = ? AND shift = ?)";
            const keyParams = u.id ? [u.id] : [u.ma_nhanvien, ngay, shift];

            const [rows] = await db.execute(
              `SELECT id, start_time, end_time, check_in, check_out FROM chamcong WHERE ${keyClause} LIMIT 1`,
              keyParams
            );
            if (!rows.length) continue;

            const id = rows[0].id;
            const { start_time, end_time } = rows[0];

            const ci = u.check_in
              ? normalizeTimeString(u.check_in)
              : rows[0].check_in;
            const co = u.check_out
              ? normalizeTimeString(u.check_out)
              : rows[0].check_out;

            // validate format nếu người dùng nhập sai
            if (
              (u.check_in && !normalizeTimeString(u.check_in)) ||
              (u.check_out && !normalizeTimeString(u.check_out))
            ) {
              continue; // bỏ qua record sai định dạng
            }

            const { late_minutes, early_minutes, status } = calcLateEarly({
              start_time,
              end_time,
              check_in: ci,
              check_out: co,
            });

            await db.execute(
              `UPDATE chamcong
                  SET check_in = ?,
                      check_out = ?,
                      ghi_chu = COALESCE(?, ghi_chu),
                      late_minutes = ?,
                      early_minutes = ?,
                      status = ?
                WHERE id = ?`,
              [
                ci,
                co,
                u.ghi_chu ?? null,
                late_minutes,
                early_minutes,
                status,
                id,
              ]
            );
            updated++;
          }

          return res.json({
            message: "Cập nhật hàng loạt thành công",
            updated,
          });
        } catch (err) {
          console.error("PUT /chamcong/bulk-update error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // GET /chamcong/shift-summary?ngay=YYYY-MM-DD&shift=Sáng|Chiều|Tối
    app.get(
      "/chamcong/shift-summary",
      requireRole(["admin", "quanly"]),
      async (req, res) => {
        try {
          const { ngay, shift } = req.query;
          if (!ngay || !shift) {
            return res.status(400).json({ error: "Thiếu ngay/shift" });
          }
          const dayOfWeek = thuMap[dayjs(ngay).day()];

          const [[{ scheduled_total }]] = await db.execute(
            `SELECT COUNT(*) AS scheduled_total
               FROM work_schedule ws
               JOIN nhanvien nv ON nv.ma_nhanvien = ws.ma_nhanvien
              WHERE ws.day_of_week = ? AND ws.shift = ? AND nv.trang_thai = 1`,
            [dayOfWeek, shift]
          );

          const [[{ leave_approved }]] = await db.execute(
            `SELECT COUNT(*) AS leave_approved
               FROM work_schedule ws
               JOIN nhanvien nv ON nv.ma_nhanvien = ws.ma_nhanvien
          LEFT JOIN don_xin_nghi_phep d
                 ON d.ma_nhanvien = ws.ma_nhanvien
                AND d.ngay_nghi = ?
                AND d.trang_thai = 'Đã duyệt'
                AND (d.nghi_ca_hay_ngay = 'Cả ngày' OR d.ca_nghi = ?)
              WHERE ws.day_of_week = ? AND ws.shift = ? AND nv.trang_thai = 1
                AND d.id IS NOT NULL`,
            [ngay, shift, dayOfWeek, shift]
          );

          const [rows] = await db.execute(
            `SELECT status FROM chamcong WHERE ngay = ? AND shift = ?`,
            [ngay, shift]
          );

          let ontime = 0,
            late = 0,
            early = 0,
            both = 0;
          rows.forEach((r) => {
            if (r.status === "Đúng giờ") ontime++;
            else if (r.status === "Đi trễ") late++;
            else if (r.status === "Về sớm") early++;
            else if (r.status === "Trễ+Sớm") both++;
          });

          return res.json({
            ngay,
            shift,
            scheduled_total,
            leave_approved,
            attendance_created: rows.length,
            ontime,
            late,
            early,
            both,
          });
        } catch (err) {
          console.error("GET /chamcong/shift-summary error:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
      }
    );

    // start
    const PORT = process.env.PORT || 5011;
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Khởi động server thất bại:", err);
  }
}

startServer();
