import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormInput,
  CButton,
  CFormSelect,
} from "@coreui/react";

const TableExample = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPhongBan, setFilterPhongBan] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [filterChucVu, setFilterChucVu] = useState("");
  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [dsChucVu, setDsChucVu] = useState([]);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("ma_nhanvien");

  let pathPrefix = "";
  if (role === "admin") pathPrefix = "/admin";
  else if (role === "quan ly") pathPrefix = "/quanly";
  else if (role === "nhan_vien") pathPrefix = "/nhan_vien";

  // Load danh sách phòng ban + chức vụ cho dropdown lọc
  useEffect(() => {
    axios
      .get("http://localhost:5004/phongban")
      .then((res) => setDsPhongBan(res.data));
    axios
      .get("http://localhost:5004/chucvu")
      .then((res) => setDsChucVu(res.data));
  }, []);

  // Load nhân viên từ API với filter
  useEffect(() => {
    axios
      .get("http://localhost:5000/nhanvien_api", {
        params: {
          keyword: searchTerm,
          filter_phongban: filterPhongBan,
          filter_trangthai: filterTrangThai,
          filter_chucvu: filterChucVu,
        },
      })
      .then((response) => {
        let data = response.data;
        if (role === "nhan_vien") {
          data = data.filter((emp) => emp.ma_nhanvien === userId);
        }
        setEmployees(data);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu:", error);
      });
  }, [role, userId, searchTerm, filterPhongBan, filterTrangThai, filterChucVu]);

  return (
    <div style={{ padding: "20px" }}>
      <h3>Danh sách nhân sự</h3>
      <div className="d-flex mb-3 gap-2">
        <CFormInput
          type="text"
          placeholder="Tìm kiếm nhân sự..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <CFormSelect
          value={filterPhongBan}
          onChange={(e) => setFilterPhongBan(e.target.value)}
        >
          <option value="">-- Tất cả phòng ban --</option>
          {dsPhongBan.map((pb) => (
            <option key={pb.ma_phongban} value={pb.ma_phongban}>
              {pb.ten_phongban}
            </option>
          ))}
        </CFormSelect>
        <CFormSelect
          value={filterTrangThai}
          onChange={(e) => setFilterTrangThai(e.target.value)}
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="1">Đang làm</option>
          <option value="0">Nghỉ làm</option>
        </CFormSelect>
        <CFormSelect
          value={filterChucVu}
          onChange={(e) => setFilterChucVu(e.target.value)}
        >
          <option value="">-- Tất cả chức vụ --</option>
          {dsChucVu.map((cv) => (
            <option key={cv.ma_chucvu} value={cv.ma_chucvu}>
              {cv.ten_chucvu}
            </option>
          ))}
        </CFormSelect>
        <CButton color="success" variant="outline">
          Search
        </CButton>
      </div>

      <CTable striped hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>#</CTableHeaderCell>
            <CTableHeaderCell>Mã</CTableHeaderCell>
            <CTableHeaderCell>Tên</CTableHeaderCell>
            <CTableHeaderCell>Giới tính </CTableHeaderCell>
            <CTableHeaderCell>Ngày sinh</CTableHeaderCell>
            <CTableHeaderCell>Phòng ban</CTableHeaderCell>
            <CTableHeaderCell>Chức vụ</CTableHeaderCell>
            <CTableHeaderCell>Ngày vào làm</CTableHeaderCell>
            <CTableHeaderCell>Trạng thái</CTableHeaderCell>
            <CTableHeaderCell>SĐT</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {employees.length > 0 ? (
            employees.map((employee, index) => (
              <CTableRow key={employee.ma_nhanvien}>
                <CTableDataCell>{index + 1}</CTableDataCell>
                <CTableDataCell>{employee.ma_nhanvien}</CTableDataCell>
                <CTableDataCell>
                  <Link
                    to={`${pathPrefix}/nhan-su/${employee.ma_nhanvien}`}
                    style={{ textDecoration: "none", color: "blue" }}
                  >
                    {employee.ho} {employee.ten}
                  </Link>
                </CTableDataCell>
                <CTableDataCell>{employee.gioi_tinh}</CTableDataCell>
                <CTableDataCell>
                  {new Date(employee.ngay_sinh).toLocaleDateString("vi-VN")}
                </CTableDataCell>
                <CTableDataCell>{employee.ten_phongban}</CTableDataCell>
                <CTableDataCell>{employee.ten_chucvu}</CTableDataCell>
                <CTableDataCell>
                  {new Date(employee.ngay_vao_lam).toLocaleDateString("vi-VN")}
                </CTableDataCell>
                <CTableDataCell>
                  {employee.trang_thai ? "Hoạt động" : "Nghỉ việc"}
                </CTableDataCell>
                <CTableDataCell>{employee.sdt}</CTableDataCell>
              </CTableRow>
            ))
          ) : (
            <CTableRow>
              <CTableDataCell colSpan="11" className="text-center">
                Không tìm thấy nhân sự nào!
              </CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>
    </div>
  );
};

export default TableExample;
