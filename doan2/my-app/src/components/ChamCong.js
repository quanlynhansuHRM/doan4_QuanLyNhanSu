// ChamCong.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CFormInput,
  CButton,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormTextarea,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
  CFormSelect,
  CFormSwitch,
} from "@coreui/react";
import dayjs from "dayjs";

const API = "http://localhost:5011";

const ChamCong = () => {
  const [user, setUser] = useState(null);
  const [ngay, setNgay] = useState(dayjs().format("YYYY-MM-DD"));
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // Ghi nhận đi trễ/về sớm (đơn lẻ)
  const [ghModal, setGhModal] = useState(false);
  const [nvList, setNvList] = useState([]);
  const [form, setForm] = useState({
    ma_nhanvien: "",
    ngay: dayjs().format("YYYY-MM-DD"),
    shift: "Sáng",
    check_in: "",
    check_out: "",
    ghi_chu: "",
  });

  // Auto mode
  const [autoMode, setAutoMode] = useState(false);
  const [loadingAutoStatus, setLoadingAutoStatus] = useState(true);

  // Quản lý theo ca
  const [shift, setShift] = useState("Sáng");
  const [shiftData, setShiftData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);

  const isManager = ["quanly", "admin"].includes(
    (user?.role || "").toString().toLowerCase().replace(/\s+/g, "")
  );

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u);

    const isM = ["quanly", "admin"].includes(
      (u?.role || "").toString().toLowerCase().replace(/\s+/g, "")
    );

    if (isM) {
      fetchRecords(ngay, u);
      loadNvList(u);
      loadAutoStatus(u);
      loadShift(ngay, shift, u);
      loadSummary(ngay, shift, u);
    } else if (u) {
      fetchMyRecords(ngay, u);
    }
    // eslint-disable-next-line
  }, []);

  const authHeader = (u = user) => {
    if (!u) return {};
    return {
      headers: {
        "x-ma-nhanvien": u.ma_nhanvien,
        "x-role": u.role, // server sẽ tự chuẩn hoá "quan ly" -> "quanly"
        "x-ma-phongban": u.ma_phongban,
      },
    };
  };

  const fetchRecords = async (d, u = user) => {
    try {
      setError("");
      const res = await axios.get(`${API}/chamcong?ngay=${d}`, authHeader(u));
      setRecords(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi khi lấy dữ liệu chấm công.");
    }
  };

  const fetchMyRecords = async (d, u = user) => {
    try {
      setError("");
      const res = await axios.get(
        `${API}/chamcong/me?ngay=${d}`,
        authHeader(u)
      );
      setRecords(res.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error || "Lỗi khi lấy dữ liệu chấm công cá nhân."
      );
    }
  };

  const loadNvList = async (u = user) => {
    try {
      const res = await axios.get(`${API}/nhanvien/dropdown`, authHeader(u));
      setNvList(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách NV", err);
    }
  };

  const loadAutoStatus = async (u = user) => {
    try {
      setLoadingAutoStatus(true);
      const res = await axios.get(`${API}/chamcong-auto/status`, authHeader(u));
      setAutoMode(!!res.data.autoMode);
    } catch (err) {
      console.error("Lỗi lấy auto status", err);
    } finally {
      setLoadingAutoStatus(false);
    }
  };

  const onChangeDate = async (e) => {
    const d = e.target.value;
    setNgay(d);
    if (isManager) {
      await fetchRecords(d);
      await loadShift(d, shift);
      await loadSummary(d, shift);
    } else {
      fetchMyRecords(d);
    }
  };

  // Edit modal: open and save (admin/quanly)
  const openEdit = (rec) => {
    setEditing({ ...rec });
    setEditModal(true);
  };
  const saveEdit = async () => {
    try {
      const payload = {
        check_in: editing.check_in,
        check_out: editing.check_out,
        ghi_chu: editing.ghi_chu,
      };
      await axios.put(`${API}/chamcong/${editing.id}`, payload, authHeader());
      setSuccess("Cập nhật thành công");
      setEditModal(false);
      fetchRecords(ngay);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi khi cập nhật chấm công.");
      setTimeout(() => setError(""), 3500);
    }
  };

  // Auto run
  const runAuto = async () => {
    try {
      await axios.post(`${API}/chamcong-auto/run`, { ngay }, authHeader());
      setSuccess("Tạo chấm công tự động thành công.");
      fetchRecords(ngay);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi khi chạy chấm công tự động.");
      setTimeout(() => setError(""), 3500);
    }
  };
  const toggleAuto = async (value) => {
    try {
      await axios.post(
        `${API}/chamcong-auto/toggle`,
        { enabled: value },
        authHeader()
      );
      setAutoMode(!!value);
      setSuccess(value ? "Bật auto chấm công." : "Tắt auto chấm công.");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Lỗi khi thay đổi trạng thái auto.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Ghi nhận đi trễ/về sớm modal (admin/quanly)
  const openGhModal = () => {
    setForm((f) => ({ ...f, ngay })); // default ngày đang xem
    setGhModal(true);
  };
  const submitGh = async () => {
    try {
      if (!form.ma_nhanvien || !form.ngay || !form.shift) {
        setError("Chọn nhân viên, ngày và ca.");
        setTimeout(() => setError(""), 2500);
        return;
      }
      await axios.post(`${API}/chamcong/ghichu`, form, authHeader());
      setSuccess("Ghi nhận đã lưu (ghi đè bản cũ nếu có).");
      setGhModal(false);
      fetchRecords(ngay);
      if (isManager) {
        await loadShift(ngay, shift);
        await loadSummary(ngay, shift);
      }
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi khi gửi ghi nhận.");
      setTimeout(() => setError(""), 3500);
    }
  };

  // Employee check-in / check-out
  const checkIn = async (shiftName) => {
    try {
      await axios.post(
        `${API}/chamcong/checkin`,
        { shift: shiftName },
        authHeader()
      );
      setSuccess(`Check-in ca ${shiftName} thành công.`);
      fetchMyRecords(ngay);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi check-in");
      setTimeout(() => setError(""), 3000);
    }
  };
  const checkOut = async (id) => {
    try {
      await axios.put(`${API}/chamcong/checkout/${id}`, {}, authHeader());
      setSuccess("Check-out thành công");
      fetchMyRecords(ngay);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi check-out");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ====== APIs quản lý theo ca ======
  const loadShift = async (d = ngay, s = shift, u = user) => {
    if (!isManager) return;
    try {
      setLoadingShift(true);
      const res = await axios.get(`${API}/chamcong/shift`, {
        ...authHeader(u),
        params: { ngay: d, shift: s },
      });
      setShiftData(
        (res.data.data || []).map((row) => {
          const cc = row.chamcong || {};
          return {
            ...row,
            _check_in: cc.check_in || "",
            _check_out: cc.check_out || "",
            _ghi_chu: cc.ghi_chu || "",
            _id: cc.id || null,
          };
        })
      );
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi tải danh sách theo ca");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoadingShift(false);
    }
  };

  const bulkCreate = async () => {
    try {
      await axios.post(
        `${API}/chamcong/bulk-create`,
        { ngay, shift },
        authHeader()
      );
      setSuccess("Đã tạo bản ghi chấm công cho ca.");
      await loadShift(ngay, shift);
      await loadSummary(ngay, shift);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(
        err.response?.data?.error || "Lỗi tạo bản ghi chấm công theo ca"
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const bulkUpdate = async () => {
    try {
      const updates = shiftData
        .filter((r) => r._id || r.chamcong) // chỉ update những ai đã có bản ghi
        .map((r) => ({
          id: r._id || r.chamcong?.id,
          ma_nhanvien: r.ma_nhanvien,
          check_in: r._check_in || null,
          check_out: r._check_out || null,
          ghi_chu: r._ghi_chu || null,
        }));
      if (updates.length === 0) {
        setError("Chưa có bản ghi nào để cập nhật.");
        setTimeout(() => setError(""), 2000);
        return;
      }
      await axios.put(
        `${API}/chamcong/bulk-update`,
        { ngay, shift, updates },
        authHeader()
      );
      setSuccess("Đã cập nhật đi trễ/về sớm theo ca.");
      await loadShift(ngay, shift);
      await loadSummary(ngay, shift);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Lỗi cập nhật theo ca");
      setTimeout(() => setError(""), 3000);
    }
  };

  const loadSummary = async (d = ngay, s = shift, u = user) => {
    if (!isManager) return;
    try {
      const res = await axios.get(`${API}/chamcong/shift-summary`, {
        ...authHeader(u),
        params: { ngay: d, shift: s },
      });
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onChangeShift = async (e) => {
    const s = e.target.value;
    setShift(s);
    await loadShift(ngay, s);
    await loadSummary(ngay, s);
  };

  // UI helpers
  const renderActionCell = (r) => {
    if (isManager) {
      return (
        <CButton size="sm" color="warning" onClick={() => openEdit(r)}>
          Sửa
        </CButton>
      );
    }
    if (user && user.ma_nhanvien === r.ma_nhanvien) {
      if (!r.check_in) {
        return (
          <CButton size="sm" color="success" onClick={() => checkIn(r.shift)}>
            Check-in
          </CButton>
        );
      } else if (r.check_in && !r.check_out) {
        return (
          <CButton size="sm" color="primary" onClick={() => checkOut(r.id)}>
            Check-out
          </CButton>
        );
      } else {
        return <span>Hoàn tất</span>;
      }
    }
    return null;
  };

  return (
    <CContainer className="mt-4">
      <CRow className="justify-content-center">
        <CCol md={10}>
          <CCard>
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Chấm công - {user?.role || "khách"}</h4>
                {isManager && (
                  <div className="d-flex align-items-center gap-2">
                    {!loadingAutoStatus && (
                      <>
                        <small className="me-2">Auto chấm công</small>
                        <CFormSwitch
                          checked={autoMode}
                          onChange={(e) => toggleAuto(e.target.checked)}
                        />
                      </>
                    )}
                    <CButton color="success" onClick={runAuto}>
                      Chạy auto ngay
                    </CButton>
                    <CButton color="primary" onClick={openGhModal}>
                      Ghi nhận đi trễ / về sớm
                    </CButton>
                  </div>
                )}
              </div>

              {error && <CAlert color="danger">{error}</CAlert>}
              {success && <CAlert color="success">{success}</CAlert>}

              {/* Bộ lọc ngày & ca cho quản lý */}
              {isManager && (
                <>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <CFormInput
                      type="date"
                      value={ngay}
                      onChange={onChangeDate}
                      style={{ maxWidth: 200 }}
                    />
                    <CFormSelect
                      value={shift}
                      onChange={onChangeShift}
                      style={{ maxWidth: 160 }}
                    >
                      <option value="Sáng">Ca Sáng</option>
                      <option value="Chiều">Ca Chiều</option>
                      <option value="Tối">Ca Tối</option>
                    </CFormSelect>
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => loadShift(ngay, shift)}
                    >
                      Tải danh sách ca
                    </CButton>
                    <CButton color="success" onClick={bulkCreate}>
                      Tạo bản ghi cho ca
                    </CButton>
                    <CButton color="primary" onClick={bulkUpdate}>
                      Lưu cập nhật đi trễ / về sớm
                    </CButton>
                  </div>

                  {summary && (
                    <CCard className="mb-3">
                      <CCardBody className="d-flex flex-wrap gap-4">
                        <div>
                          <strong>Tổng theo lịch:</strong>{" "}
                          {summary.scheduled_total}
                        </div>
                        <div>
                          <strong>Nghỉ phép (đã duyệt):</strong>{" "}
                          {summary.leave_approved}
                        </div>
                        <div>
                          <strong>Đã tạo bản ghi:</strong>{" "}
                          {summary.attendance_created}
                        </div>
                        <div>
                          <strong>Đúng giờ:</strong> {summary.ontime}
                        </div>
                        <div>
                          <strong>Đi trễ:</strong> {summary.late}
                        </div>
                        <div>
                          <strong>Về sớm:</strong> {summary.early}
                        </div>
                        <div>
                          <strong>Trễ+Sớm:</strong> {summary.both}
                        </div>
                      </CCardBody>
                    </CCard>
                  )}

                  <CCard className="mb-4">
                    <CCardBody>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5>
                          Quản lý ca {shift} – {ngay}
                        </h5>
                        {loadingShift && (
                          <small className="text-muted">Đang tải...</small>
                        )}
                      </div>

                      <CTable hover responsive>
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell style={{ minWidth: 110 }}>
                              Mã NV
                            </CTableHeaderCell>
                            <CTableHeaderCell>Họ tên</CTableHeaderCell>
                            <CTableHeaderCell>Phòng</CTableHeaderCell>
                            <CTableHeaderCell>Giờ chuẩn</CTableHeaderCell>
                            <CTableHeaderCell>Check-in</CTableHeaderCell>
                            <CTableHeaderCell>Check-out</CTableHeaderCell>
                            <CTableHeaderCell>Ghi chú</CTableHeaderCell>
                            <CTableHeaderCell>Nghỉ phép</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {shiftData.length === 0 ? (
                            <CTableRow>
                              <CTableDataCell
                                colSpan={8}
                                className="text-center text-muted"
                              >
                                Không có dữ liệu cho ca này
                              </CTableDataCell>
                            </CTableRow>
                          ) : (
                            shiftData.map((r) => {
                              const disabled = r.leave_approved; // nghỉ phép => không cho nhập
                              return (
                                <CTableRow key={r.ma_nhanvien}>
                                  <CTableDataCell>
                                    {r.ma_nhanvien}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {r.ho} {r.ten}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {r.ma_phongban}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {r.start_time || "-"} → {r.end_time || "-"}
                                  </CTableDataCell>
                                  <CTableDataCell style={{ maxWidth: 140 }}>
                                    <CFormInput
                                      placeholder="HH:mm hoặc HH:mm:ss"
                                      value={r._check_in}
                                      disabled={disabled}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setShiftData((prev) =>
                                          prev.map((x) =>
                                            x.ma_nhanvien === r.ma_nhanvien
                                              ? { ...x, _check_in: v }
                                              : x
                                          )
                                        );
                                      }}
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell style={{ maxWidth: 140 }}>
                                    <CFormInput
                                      placeholder="HH:mm hoặc HH:mm:ss"
                                      value={r._check_out}
                                      disabled={disabled}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setShiftData((prev) =>
                                          prev.map((x) =>
                                            x.ma_nhanvien === r.ma_nhanvien
                                              ? { ...x, _check_out: v }
                                              : x
                                          )
                                        );
                                      }}
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormTextarea
                                      rows={1}
                                      value={r._ghi_chu}
                                      disabled={disabled}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setShiftData((prev) =>
                                          prev.map((x) =>
                                            x.ma_nhanvien === r.ma_nhanvien
                                              ? { ...x, _ghi_chu: v }
                                              : x
                                          )
                                        );
                                      }}
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {r.leave_approved ? (
                                      <CAlert
                                        color="info"
                                        className="py-1 mb-0"
                                      >
                                        Đã duyệt
                                      </CAlert>
                                    ) : (
                                      <small className="text-muted">—</small>
                                    )}
                                  </CTableDataCell>
                                </CTableRow>
                              );
                            })
                          )}
                        </CTableBody>
                      </CTable>
                    </CCardBody>
                  </CCard>
                </>
              )}

              {/* Bảng dữ liệu tổng quan trong ngày (giữ nguyên logic cũ) */}
              <div className="d-flex gap-2 mb-3">
                {!isManager && (
                  <CFormInput
                    type="date"
                    value={ngay}
                    onChange={onChangeDate}
                    style={{ maxWidth: 200 }}
                  />
                )}
              </div>

              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Mã NV</CTableHeaderCell>
                    <CTableHeaderCell>Ngày</CTableHeaderCell>
                    <CTableHeaderCell>Ca</CTableHeaderCell>
                    <CTableHeaderCell>Giờ vào</CTableHeaderCell>
                    <CTableHeaderCell>Giờ ra</CTableHeaderCell>
                    <CTableHeaderCell>Ghi chú</CTableHeaderCell>
                    <CTableHeaderCell>Hành động</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {records.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={7}
                        className="text-center text-muted"
                      >
                        Chưa có bản ghi
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    records.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell>{r.ma_nhanvien}</CTableDataCell>
                        <CTableDataCell>{r.ngay}</CTableDataCell>
                        <CTableDataCell>{r.shift}</CTableDataCell>
                        <CTableDataCell>{r.check_in || "-"}</CTableDataCell>
                        <CTableDataCell>{r.check_out || "-"}</CTableDataCell>
                        <CTableDataCell>{r.ghi_chu || ""}</CTableDataCell>
                        <CTableDataCell>{renderActionCell(r)}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal edit (admin/quanly) */}
      <CModal visible={editModal} onClose={() => setEditModal(false)}>
        <CModalHeader>
          <CModalTitle>Chỉnh sửa chấm công</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {editing && (
            <>
              <div className="mb-2">
                <label>Mã nhân viên</label>
                <CFormInput value={editing.ma_nhanvien} disabled />
              </div>
              <div className="mb-2">
                <label>Ngày</label>
                <CFormInput value={editing.ngay} disabled />
              </div>
              <div className="mb-2">
                <label>Ca</label>
                <CFormInput value={editing.shift} disabled />
              </div>
              <div className="mb-2">
                <label>Check In (HH:mm hoặc HH:mm:ss)</label>
                <CFormInput
                  value={editing.check_in || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, check_in: e.target.value })
                  }
                />
              </div>
              <div className="mb-2">
                <label>Check Out (HH:mm hoặc HH:mm:ss)</label>
                <CFormInput
                  value={editing.check_out || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, check_out: e.target.value })
                  }
                />
              </div>
              <div className="mb-2">
                <label>Ghi chú</label>
                <CFormTextarea
                  value={editing.ghi_chu || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, ghi_chu: e.target.value })
                  }
                />
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModal(false)}>
            Hủy
          </CButton>
          <CButton color="primary" onClick={saveEdit}>
            Lưu
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal Ghi nhận đi trễ / về sớm (admin/quanly) */}
      <CModal visible={ghModal} onClose={() => setGhModal(false)}>
        <CModalHeader>
          <CModalTitle>Ghi nhận đi trễ / về sớm</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-2">
            <label>Nhân viên</label>
            <CFormSelect
              value={form.ma_nhanvien}
              onChange={(e) =>
                setForm({ ...form, ma_nhanvien: e.target.value })
              }
            >
              <option value="">-- Chọn nhân viên --</option>
              {nvList.map((nv) => (
                <option key={nv.ma_nhanvien} value={nv.ma_nhanvien}>
                  {nv.ma_nhanvien} - {nv.ho} {nv.ten}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-2">
            <label>Ngày</label>
            <CFormInput
              type="date"
              value={form.ngay}
              onChange={(e) => setForm({ ...form, ngay: e.target.value })}
            />
          </div>
          <div className="mb-2">
            <label>Ca</label>
            <CFormSelect
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
            >
              <option>Sáng</option>
              <option>Chiều</option>
              <option>Tối</option>
            </CFormSelect>
          </div>
          <div className="mb-2">
            <label>Check In (HH:mm hoặc HH:mm:ss)</label>
            <CFormInput
              value={form.check_in}
              onChange={(e) => setForm({ ...form, check_in: e.target.value })}
            />
          </div>
          <div className="mb-2">
            <label>Check Out (HH:mm hoặc HH:mm:ss)</label>
            <CFormInput
              value={form.check_out}
              onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            />
          </div>
          <div className="mb-2">
            <label>Ghi chú</label>
            <CFormTextarea
              value={form.ghi_chu}
              onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setGhModal(false)}>
            Hủy
          </CButton>
          <CButton color="primary" onClick={submitGh}>
            Gửi (ghi đè nếu đã có)
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default ChamCong;
