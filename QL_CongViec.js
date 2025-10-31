import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
  CBadge,
} from "@coreui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const PAGE_SIZE = 8;
const COLORS = ["#0d6efd", "#ffc107", "#28a745", "#6c757d", "#dc3545"];

const QL_CongViec = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = (user?.role || "").toLowerCase();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [visibleAdd, setVisibleAdd] = useState(false);
  const [visibleEdit, setVisibleEdit] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [page, setPage] = useState(1);

  // Dữ liệu thống kê năng suất nhân viên
  const [employeeStats, setEmployeeStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const emptyTask = {
    ten_cong_viec: "",
    mo_ta: "",
    nguoi_duoc_giao: [],
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    trang_thai: "Chưa bắt đầu",
  };
  const [newTask, setNewTask] = useState(emptyTask);

  // Bộ nhớ tạm cho cảnh báo đã hiển thị (tránh lặp lại)
  const [notifiedTasks, setNotifiedTasks] = useState(
    new Set(JSON.parse(localStorage.getItem("notifiedTasks") || "[]"))
  );

  // Convert datetime
  const dbToInputDatetime = (dbVal) => {
    if (!dbVal) return "";
    const s = dbVal.replace(" ", "T");
    return s.length >= 16 ? s.substring(0, 16) : s;
  };

  // Fetch nhân viên
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5015/dsnhanvien", {
        params: {
          role: role,
          phongban: user?.ma_phongban,
          ma_nhanvien: user?.ma_nhanvien,
        },
      });
      setEmployees(res.data || []);
    } catch {
      toast.error("Lỗi lấy danh sách nhân viên");
    }
  };

  // Fetch công việc
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5015/congviec", {
        params: {
          role: user.role,
          ma_nhanvien: user.ma_nhanvien,
          phongban: user.ma_phongban,
        },
      });

      let data = res.data || [];
      const now = new Date();
      const updatedNotified = new Set(notifiedTasks);

      data.forEach((task) => {
        const isRelated =
          (task.ds_ma_nguoi_duoc_giao || "")
            .split(",")
            .includes(user.ma_nhanvien) || task.nguoi_giao === user.ma_nhanvien;
        if (!isRelated) return;

        if (!task.ngay_ket_thuc || task.trang_thai === "Hoàn thành") return;

        const end = new Date(task.ngay_ket_thuc);
        const diffHours = (end - now) / (1000 * 60 * 60);

        if (!updatedNotified.has(task.id)) {
          if (diffHours < 0) {
            toast.error(`Công việc "${task.ten_cong_viec}" đã quá hạn!`, {
              autoClose: 4000,
              theme: "colored",
            });
            updatedNotified.add(task.id);
          } else if (diffHours <= 48) {
            toast.warn(
              `Công việc "${task.ten_cong_viec}" sắp đến hạn (${Math.floor(
                diffHours
              )} giờ nữa)!`,
              { autoClose: 4000, theme: "colored" }
            );
            updatedNotified.add(task.id);
          }
        }
      });

      // Cập nhật danh sách công việc + lưu thông báo đã hiển thị
      setTasks(data);
      setNotifiedTasks(updatedNotified);
      localStorage.setItem(
        "notifiedTasks",
        JSON.stringify(Array.from(updatedNotified))
      );
    } catch {
      toast.error("Không thể lấy danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  // Fetch thống kê năng suất nhân viên
  const fetchEmployeeStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get("http://localhost:5015/thongke/nangsuat", {
        params: {
          role: user.role,
          phongban: user.ma_phongban,
          ma_nhanvien: user.ma_nhanvien,
        },
      });
      setEmployeeStats(res.data || []);
    } catch {
      toast.error("Lỗi lấy thống kê năng suất nhân viên");
    } finally {
      setLoadingStats(false);
    }
  };

  // Kết nối realtime
  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchEmployeeStats();

    const socket = io("http://localhost:5015");
    socket.emit("registerUser", user);

    socket.on("newTask", (data) => {
      toast.info(data.message);
      fetchTasks();
      fetchEmployeeStats();
    });

    socket.on("taskCompleted", (data) => {
      toast.success(data.message);
      fetchTasks();
      fetchEmployeeStats();
    });

    socket.on("statsUpdated", () => fetchEmployeeStats());

    return () => socket.disconnect();
  }, []);

  const formatDateTime = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return dt.toLocaleString("vi-VN", { hour12: false });
    } catch {
      return d;
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "Đang thực hiện":
        return <CBadge color="warning">Đang thực hiện</CBadge>;
      case "Hoàn thành":
        return <CBadge color="success">Hoàn thành</CBadge>;
      case "Tạm dừng":
        return <CBadge color="secondary">Tạm dừng</CBadge>;
      case "Quá hạn":
        return <CBadge color="danger">Quá hạn</CBadge>;
      default:
        return <CBadge color="info">Chưa bắt đầu</CBadge>;
    }
  };

  // Đánh dấu hoàn thành
  const handleMarkComplete = async (task) => {
    try {
      await axios.put(`http://localhost:5015/congviec/hoanthanh/${task.id}`, {
        nguoi_thuchien: user.hoten,
        nguoi_giao: task.nguoi_giao,
        ten_cong_viec: task.ten_cong_viec,
      });
      toast.success("Đã đánh dấu công việc hoàn thành");
      fetchTasks();
      fetchEmployeeStats();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // Xóa công việc
  const handleDelete = async (id, name) => {
    const confirm = await Swal.fire({
      title: "🗑️ Xác nhận xóa?",
      text: `Bạn có chắc muốn xóa công việc "${name}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Có xóa ngay",
      cancelButtonText: "Hủy",
      background: "#fff",
      color: "#333",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5015/congviec/${id}`);
        toast.success(" Công việc đã được xóa khỏi hệ thống!", {
          theme: "colored",
          style: { backgroundColor: "#dc3545" },
        });
        fetchTasks();
        fetchEmployeeStats();
      } catch {
        toast.error("Lỗi khi xóa công việc", { theme: "colored" });
      }
    }
  };

  // Thêm công việc
  const handleAdd = async () => {
    if (!newTask.ten_cong_viec || newTask.nguoi_duoc_giao.length === 0) {
      toast.warn("⚠️ Vui lòng nhập đủ thông tin công việc!");
      return;
    }
    setActionLoading(true);
    const payload = {
      ...newTask,
      nguoi_giao: user.ma_nhanvien,
      ngay_bat_dau: newTask.ngay_bat_dau || null,
      ngay_ket_thuc: newTask.ngay_ket_thuc || null,
    };
    try {
      await axios.post("http://localhost:5015/congviec", payload);
      toast.success(" Thêm công việc thành công!");
      setVisibleAdd(false);
      setNewTask(emptyTask);
      fetchTasks();
      fetchEmployeeStats();
    } catch {
      toast.error(" Lỗi thêm công việc!");
    } finally {
      setActionLoading(false);
    }
  };

  //  Sửa công việc
  const handleEdit = async () => {
    setActionLoading(true);
    try {
      const payload = { ...selectedTask };
      if (!payload.trang_thai) delete payload.trang_thai; //

      await axios.put(
        `http://localhost:5015/congviec/${selectedTask.id}`,
        payload
      );
      toast.success("Cập nhật công việc thành công!");
      setVisibleEdit(false);
      fetchTasks();
      fetchEmployeeStats?.();
    } catch (err) {
      console.error(err);
      toast.error(" Lỗi cập nhật công việc!");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (t) => {
    setSelectedTask({
      ...t,
      nguoi_duoc_giao: t.ds_ma_nguoi_duoc_giao
        ? t.ds_ma_nguoi_duoc_giao.split(",")
        : [],
      ngay_bat_dau: dbToInputDatetime(t.ngay_bat_dau),
      ngay_ket_thuc: dbToInputDatetime(t.ngay_ket_thuc),
    });
    setVisibleEdit(true);
  };

  // Filter + tìm kiếm
  const filtered = tasks.filter((t) => {
    const matchStatus =
      filterStatus === "Tất cả" ? true : t.trang_thai === filterStatus;
    const text = searchText.trim().toLowerCase();
    const matchSearch =
      !text ||
      t.ten_cong_viec?.toLowerCase().includes(text) ||
      t.mo_ta?.toLowerCase().includes(text) ||
      t.ten_nguoi_giao?.toLowerCase().includes(text) ||
      t.thong_tin_nguoi_duoc_giao?.toLowerCase().includes(text);
    return matchStatus && matchSearch;
  });

  const pageTasks = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts = {
    "Chưa bắt đầu": 0,
    "Đang thực hiện": 0,
    "Hoàn thành": 0,
    "Tạm dừng": 0,
    "Quá hạn": 0,
  };
  tasks.forEach((t) => {
    if (statusCounts[t.trang_thai] !== undefined) statusCounts[t.trang_thai]++;
  });
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Thống kê năng suất nhân viên */}
      <CCard className="shadow-sm mb-4">
        <CCardHeader>🧾 Thống kê năng suất nhân viên</CCardHeader>
        <CCardBody>
          {loadingStats ? (
            <CSpinner />
          ) : (
            <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
              <div style={{ flex: 1, minWidth: 360 }}>
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã NV</th>
                      <th>Họ tên</th>
                      <th>Tổng</th>
                      <th>HT</th>
                      <th>QH</th>
                      <th>% HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      employeeStats.map((e, i) => (
                        <tr key={e.ma_nhanvien}>
                          <td>{i + 1}</td>
                          <td>{e.ma_nhanvien}</td>
                          <td>{e.hoten}</td>
                          <td>{e.tong_viec}</td>
                          <td>{e.hoan_thanh}</td>
                          <td>{e.qua_han}</td>
                          <td>{e.ti_le_hoan_thanh}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ flex: 1, height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeStats.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ma_nhanvien" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tong_viec" name="Tổng" fill="#0d6efd" />
                    <Bar
                      dataKey="hoan_thanh"
                      name="Hoàn thành"
                      fill="#28a745"
                    />
                    <Bar dataKey="qua_han" name="Quá hạn" fill="#dc3545" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/*  Dashboard công việc */}
      <CCard className="shadow-sm mb-4">
        <CCardHeader>📊 Thống kê công việc</CCardHeader>
        <CCardBody style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CCardBody>
      </CCard>

      {/*  Danh sách công việc */}
      <CCard className="shadow-sm p-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5>📋 Quản lý công việc</h5>
          <div className="d-flex gap-2">
            <CFormInput
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <CFormSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tất cả">Tất cả</option>
              {Object.keys(statusCounts).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </CFormSelect>
            {(role === "admin" || role.includes("quan")) && (
              <CButton color="primary" onClick={() => setVisibleAdd(true)}>
                + Thêm công việc
              </CButton>
            )}
          </div>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner />
          ) : (
            <CTable hover responsive>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Tên công việc</CTableHeaderCell>
                  <CTableHeaderCell>Người giao</CTableHeaderCell>
                  <CTableHeaderCell>Người được giao</CTableHeaderCell>
                  <CTableHeaderCell>Ngày bắt đầu</CTableHeaderCell>
                  <CTableHeaderCell>Ngày kết thúc</CTableHeaderCell>
                  <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                  <CTableHeaderCell>Hành động</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {pageTasks.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center">
                      Không có công việc
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageTasks.map((t, i) => (
                    <CTableRow key={t.id}>
                      <CTableDataCell>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </CTableDataCell>
                      <CTableDataCell>{t.ten_cong_viec}</CTableDataCell>
                      <CTableDataCell>{t.ten_nguoi_giao}</CTableDataCell>
                      <CTableDataCell>
                        {t.ds_ma_nguoi_duoc_giao
                          ? t.thong_tin_nguoi_duoc_giao
                              ?.split(", ")
                              .map((nv) => {
                                const match = nv.match(/(.*)\s\((NV\d+)\)/);
                                const hoten = match ? match[1].trim() : nv;
                                const maNV = match ? match[2] : "";
                                return `${hoten || "—"} (${maNV})`;
                              })
                              .join(", ")
                          : "—"}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDateTime(t.ngay_bat_dau)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDateTime(t.ngay_ket_thuc)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {statusBadge(t.trang_thai)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {role === "nhan_vien" &&
                          (t.ds_ma_nguoi_duoc_giao || "")
                            .split(",")
                            .includes(user.ma_nhanvien) &&
                          t.trang_thai === "Đang thực hiện" && (
                            <CButton
                              size="sm"
                              color="success"
                              onClick={() => handleMarkComplete(t)}
                            >
                              Hoàn thành
                            </CButton>
                          )}
                        {(role === "admin" || role.includes("quan")) && (
                          <>
                            <CButton
                              size="sm"
                              color="warning"
                              className="ms-2"
                              onClick={() => openEditModal(t)}
                            >
                              Sửa
                            </CButton>
                            <CButton
                              size="sm"
                              color="danger"
                              className="ms-2"
                              onClick={() =>
                                handleDelete(t.id, t.ten_cong_viec)
                              }
                            >
                              Xóa
                            </CButton>
                          </>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Modal Thêm */}
      <CModal visible={visibleAdd} onClose={() => setVisibleAdd(false)}>
        <CModalHeader>Thêm công việc</CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              label="Tên công việc"
              value={newTask.ten_cong_viec}
              onChange={(e) =>
                setNewTask({ ...newTask, ten_cong_viec: e.target.value })
              }
              className="mb-3"
            />
            <CFormTextarea
              label="Mô tả"
              value={newTask.mo_ta}
              onChange={(e) =>
                setNewTask({ ...newTask, mo_ta: e.target.value })
              }
              className="mb-3"
            />
            <CFormSelect
              multiple
              label="Người được giao"
              value={newTask.nguoi_duoc_giao}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  nguoi_duoc_giao: Array.from(
                    e.target.selectedOptions,
                    (o) => o.value
                  ),
                })
              }
              className="mb-3"
            >
              {employees.map((e) => (
                <option key={e.ma_nhanvien} value={e.ma_nhanvien}>
                  {e.hoten} ({e.phongban})
                </option>
              ))}
            </CFormSelect>
            <CFormInput
              type="datetime-local"
              label="Ngày & giờ bắt đầu"
              value={newTask.ngay_bat_dau}
              onChange={(e) =>
                setNewTask({ ...newTask, ngay_bat_dau: e.target.value })
              }
              className="mb-3"
            />
            <CFormInput
              type="datetime-local"
              label="Ngày & giờ kết thúc"
              value={newTask.ngay_ket_thuc}
              onChange={(e) =>
                setNewTask({ ...newTask, ngay_ket_thuc: e.target.value })
              }
              className="mb-3"
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisibleAdd(false)}>
            Hủy
          </CButton>
          <CButton color="primary" onClick={handleAdd} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : "Thêm"}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal Sửa */}
      <CModal visible={visibleEdit} onClose={() => setVisibleEdit(false)}>
        <CModalHeader>Chỉnh sửa công việc</CModalHeader>
        <CModalBody>
          {selectedTask && (
            <CForm>
              <CFormInput
                label="Tên công việc"
                value={selectedTask.ten_cong_viec}
                onChange={(e) =>
                  setSelectedTask({
                    ...selectedTask,
                    ten_cong_viec: e.target.value,
                  })
                }
                className="mb-3"
              />
              <CFormTextarea
                label="Mô tả"
                value={selectedTask.mo_ta}
                onChange={(e) =>
                  setSelectedTask({ ...selectedTask, mo_ta: e.target.value })
                }
                className="mb-3"
              />
              <CFormSelect
                multiple
                label="Người được giao"
                value={selectedTask.nguoi_duoc_giao || []}
                onChange={(e) =>
                  setSelectedTask({
                    ...selectedTask,
                    nguoi_duoc_giao: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value
                    ),
                  })
                }
                className="mb-3"
              >
                {employees.map((e) => (
                  <option key={e.ma_nhanvien} value={e.ma_nhanvien}>
                    {e.hoten} ({e.phongban})
                  </option>
                ))}
              </CFormSelect>
              <CFormInput
                type="datetime-local"
                label="Ngày & giờ bắt đầu"
                value={selectedTask.ngay_bat_dau}
                onChange={(e) =>
                  setSelectedTask({
                    ...selectedTask,
                    ngay_bat_dau: e.target.value,
                  })
                }
                className="mb-3"
              />
              <CFormInput
                type="datetime-local"
                label="Ngày & giờ kết thúc"
                value={selectedTask.ngay_ket_thuc}
                onChange={(e) =>
                  setSelectedTask({
                    ...selectedTask,
                    ngay_ket_thuc: e.target.value,
                  })
                }
                className="mb-3"
              />
              <CFormSelect
                label="Trạng thái"
                value={selectedTask.trang_thai}
                onChange={(e) =>
                  setSelectedTask({
                    ...selectedTask,
                    trang_thai: e.target.value,
                  })
                }
              >
                {Object.keys(statusCounts).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </CFormSelect>
            </CForm>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisibleEdit(false)}>
            Hủy
          </CButton>
          <CButton
            color="primary"
            onClick={handleEdit}
            disabled={actionLoading}
          >
            {actionLoading ? <CSpinner size="sm" /> : "Lưu"}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default QL_CongViec;
