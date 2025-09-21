import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBreadcrumb,
  CBreadcrumbItem,
  CRow,
} from "@coreui/react";

const PbChiTiet = () => {
  const { id } = useParams();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  useEffect(() => {
    if (!role || (role !== "admin" && role !== "quan ly")) {
      return;
    }

    // Lấy danh sách nhân sự của phòng ban
    axios
      .get(`http://localhost:5005/dsphongban/${id}`)
      .then((response) => {
        setEmployees(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Không tìm thấy nhân sự");
        setLoading(false);
      });
  }, [id, role]);

  const handleDelete = async (ma_nhanvien) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xoá nhân sự ${ma_nhanvien} không?`
    );
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(
        `http://localhost:5006/xoanhanvien/${ma_nhanvien}`
      );
      alert(res.data.message);

      setEmployees((prev) =>
        prev.filter((emp) => emp.ma_nhanvien !== ma_nhanvien)
      );
    } catch (err) {
      console.error("AxiosError chi tiết:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          `Lỗi không xác định: ${err.message}`
      );
    }
  };

  if (!role || (role !== "admin" && role !== "quan ly")) {
    return (
      <p className="text-danger">Bạn không có quyền truy cập trang này.</p>
    );
  }

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      {role === "admin" && (
        <CRow className="p-3">
          <CBreadcrumb className="mb-3">
            <CBreadcrumbItem>
              <Link to="/admin/ds_PhongBan">Danh sách phòng ban</Link>
            </CBreadcrumbItem>
            <CBreadcrumbItem active>Xem chi tiết</CBreadcrumbItem>
          </CBreadcrumb>
        </CRow>
      )}

      <h2>Danh sách nhân sự của phòng ban {id}</h2>
      <CTable striped hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>#</CTableHeaderCell>
            <CTableHeaderCell>Tên nhân sự</CTableHeaderCell>
            <CTableHeaderCell>Mã nhân sự</CTableHeaderCell>
            <CTableHeaderCell>Điện thoại</CTableHeaderCell>
            <CTableHeaderCell>Chức vụ</CTableHeaderCell>
            <CTableHeaderCell>Trạng thái</CTableHeaderCell>
            <CTableHeaderCell>Giới tính</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {employees.length > 0 ? (
            employees.map((employee, index) => (
              <CTableRow key={employee.ma_nhanvien}>
                <CTableDataCell>{index + 1}</CTableDataCell>
                <CTableDataCell>
                  <Link
                    to={`/${role === "admin" ? "admin" : "quanly"}/nhan-su/${
                      employee.ma_nhanvien
                    }`}
                    style={{ textDecoration: "none", color: "blue" }}
                  >
                    {employee.ho} {employee.ten}
                  </Link>
                </CTableDataCell>
                <CTableDataCell>{employee.ma_nhanvien}</CTableDataCell>
                <CTableDataCell>{employee.sdt}</CTableDataCell>
                <CTableDataCell>{employee.chuc_vu}</CTableDataCell>
                <CTableDataCell>
                  {employee.trang_thai ? "Hoạt động" : "Nghỉ việc"}
                </CTableDataCell>
                <CTableDataCell>{employee.gioi_tinh}</CTableDataCell>
              </CTableRow>
            ))
          ) : (
            <CTableRow>
              <CTableDataCell colSpan="8" className="text-center">
                Không có nhân sự trong phòng ban này.
              </CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>
    </div>
  );
};

export default PbChiTiet;
