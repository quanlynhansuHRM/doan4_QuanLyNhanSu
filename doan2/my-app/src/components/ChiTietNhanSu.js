import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { CCard, CCardBody, CRow, CCol, CImage, CButton } from "@coreui/react";

const ChiTietNhanSu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const role = currentUser?.role;

  const backLink =
    new URLSearchParams(location.search).get("back") || "/admin/ds_nhansu";

  useEffect(() => {
    axios
      .get("http://localhost:5000/nhanvien_api")
      .then((response) => {
        const foundEmployee = response.data.find((e) => e.ma_nhanvien === id);
        setEmployee(foundEmployee);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu:", error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (!employee) return <p>Không tìm thấy nhân sự!</p>;

  return (
    <CRow className="p-3">
      <CCol md={4}>
        <CCard className="text-center p-3 d-flex flex-column align-items-center">
          <CImage
            rounded
            src={
              employee.hinh_anh
                ? `data:image/${employee.dinh_dang_anh || "jpeg"};base64,${
                    employee.hinh_anh
                  }`
                : "/images/default.png"
            }
            width="120px"
            className="mb-3"
          />
        </CCard>
      </CCol>

      <CCol md={8}>
        <CCard className="p-3">
          <CCardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Thông tin nhân sự</h4>
              {role === "admin" && (
                <CButton color="secondary" onClick={() => navigate(backLink)}>
                  ← Quay lại danh sách
                </CButton>
              )}
            </div>

            <CRow>
              <CCol md={6}>
                <p>
                  <strong>Mã nhân sự:</strong> {employee.ma_nhanvien}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Họ và tên:</strong> {employee.ho} {employee.ten}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Giới tính:</strong> {employee.gioi_tinh}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Ngày sinh:</strong>{" "}
                  {new Date(employee.ngay_sinh).toLocaleDateString("vi-VN")}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Ngày vào làm:</strong>{" "}
                  {new Date(employee.ngay_vao_lam).toLocaleDateString("vi-VN")}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Số điện thoại:</strong> {employee.sdt}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Lương cơ bản:</strong> {employee.luong_cb}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  {employee.trang_thai === 1 ? "Hoạt động" : "Dừng hoạt động"}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Phòng ban:</strong> {employee.ten_phongban}
                </p>
              </CCol>
              <CCol md={6}>
                <p>
                  <strong>Chức vụ:</strong> {employee.ten_chucvu}
                </p>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default ChiTietNhanSu;
