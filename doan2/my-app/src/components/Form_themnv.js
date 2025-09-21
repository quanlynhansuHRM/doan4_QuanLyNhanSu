import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CContainer,
  CAlert,
  CRow,
  CCol,
  CCard,
  CCardBody,
} from "@coreui/react";

const ThemNhanSu = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const maPhongBanLocal = currentUser?.ma_phongban;

  const [formData, setFormData] = useState({
    ten: "",
    ma_nhanvien: "",
    sdt: "",
    ma_chucvu: "",
    gioi_tinh: "Nam",
    trang_thai: "1",
    ma_phongban: "",
    ngay_sinh: "",
    ngay_vao_lam: "",
    role: "nhan_vien",
    luong_cb: "",
    password: "",
  });

  const isQuanLy = formData.role === "quan ly";

  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [dsChucVu, setDsChucVu] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5004/phongban")
      .then((res) => setDsPhongBan(res.data))
      .catch((err) => console.error("Lỗi lấy phòng ban:", err));

    axios
      .get("http://localhost:5004/chucvu")
      .then((res) => setDsChucVu(res.data))
      .catch((err) => console.error("Lỗi lấy chức vụ:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.ten ||
      !formData.ma_nhanvien ||
      !formData.password ||
      !formData.luong_cb ||
      !formData.ma_chucvu ||
      (!isQuanLy && !formData.ma_phongban)
    ) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (new Date(formData.ngay_sinh) >= new Date(formData.ngay_vao_lam)) {
      setError("Ngày sinh phải trước ngày vào làm.");
      return;
    }

    const payload = {
      ...formData,
      ma_phongban:
        formData.role === "quan ly"
          ? currentUser.ma_phongban
          : formData.ma_phongban,
      ma_nhanvien_nguoi_tao: currentUser.ma_nhanvien,
      role_nguoi_tao: currentUser.role,
      ma_phongban_nguoi_tao: currentUser.ma_phongban,
    };

    try {
      const res = await axios.post("http://localhost:5004/themnhansu", payload);
      setSuccess(res.data.message);
      setError("");
    } catch (err) {
      console.error("Lỗi gửi dữ liệu:", err);
      setError(err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại.");
      setSuccess("");
    }
  };

  return (
    <CContainer className="mt-4">
      <CRow className="justify-content-center">
        <CCol md={8}>
          <CCard>
            <CCardBody>
              {error && <CAlert color="danger">{error}</CAlert>}
              {success && <CAlert color="success">{success}</CAlert>}
              <h4 className="text-center">Thêm nhân sự</h4>
              <CForm onSubmit={handleSubmit}>
                <CFormInput
                  label="Tên nhân viên"
                  name="ten"
                  value={formData.ten}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormInput
                  label="Mã nhân viên"
                  name="ma_nhanvien"
                  value={formData.ma_nhanvien}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormInput
                  label="Mật khẩu"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormSelect
                  label="Giới tính"
                  name="gioi_tinh"
                  value={formData.gioi_tinh}
                  onChange={handleChange}
                  className="mb-3"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </CFormSelect>
                <CFormInput
                  label="Ngày sinh"
                  type="date"
                  name="ngay_sinh"
                  value={formData.ngay_sinh}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormInput
                  label="Ngày vào làm"
                  type="date"
                  name="ngay_vao_lam"
                  value={formData.ngay_vao_lam}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormInput
                  label="Lương cơ bản"
                  name="luong_cb"
                  value={formData.luong_cb}
                  onChange={handleChange}
                  className="mb-3"
                />

                {isQuanLy ? (
                  <CFormInput
                    label="Phòng ban"
                    value={maPhongBanLocal}
                    disabled
                    className="mb-3"
                  />
                ) : (
                  <CFormSelect
                    label="Phòng ban"
                    name="ma_phongban"
                    value={formData.ma_phongban}
                    onChange={handleChange}
                    className="mb-3"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {dsPhongBan.map((pb) => (
                      <option key={pb.ma_phongban} value={pb.ma_phongban}>
                        {pb.ten_phongban}
                      </option>
                    ))}
                  </CFormSelect>
                )}

                <CFormSelect
                  label="Chức vụ"
                  name="ma_chucvu"
                  value={formData.ma_chucvu}
                  onChange={handleChange}
                  className="mb-3"
                >
                  <option value="">-- Chọn chức vụ --</option>
                  {dsChucVu.map((cv) => (
                    <option key={cv.ma_chucvu} value={cv.ma_chucvu}>
                      {cv.ten_chucvu}
                    </option>
                  ))}
                </CFormSelect>

                <CFormInput
                  label="Số điện thoại"
                  name="sdt"
                  value={formData.sdt}
                  onChange={handleChange}
                  className="mb-3"
                />

                <CFormSelect
                  label="Trạng thái làm việc"
                  name="trang_thai"
                  value={formData.trang_thai}
                  onChange={handleChange}
                  className="mb-3"
                >
                  <option value="1">Đang làm</option>
                  <option value="0">Nghỉ làm</option>
                </CFormSelect>

                <CFormSelect
                  label="Vai trò"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mb-3"
                >
                  <option value="nhan_vien">Nhân viên</option>
                  <option value="quan ly">Quản lý</option>
                </CFormSelect>

                <CButton type="submit" color="primary">
                  Thêm nhân sự
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default ThemNhanSu;
