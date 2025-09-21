import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
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

const EmployeeForm = ({ onSuccess }) => {
  const location = useLocation();
  const isNhanVienView = location.pathname.includes("/nhan_vien");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdminOrManager =
    currentUser.role === "admin" || currentUser.role === "quan ly";

  const [formData, setFormData] = useState({
    ma_nhanvien: "",
    ho: "",
    ten: "",
    password: "",
    gioi_tinh: "Nam",
    ngay_sinh: "",
    ngay_vao_lam: "",
    sdt: "",
    luong_cb: "",
    ma_chucvu: "",
    ten_phongban: "",
    trang_thai: "1",
    role: "nhan_vien",
  });

  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [dsChucVu, setDsChucVu] = useState([]);
  const [dsNhanVien, setDsNhanVien] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [filterPhongBan, setFilterPhongBan] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [filterChucVu, setFilterChucVu] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load danh sách phòng ban, chức vụ
  useEffect(() => {
    axios
      .get("http://localhost:5004/phongban")
      .then((res) => setDsPhongBan(res.data));
    axios
      .get("http://localhost:5004/chucvu")
      .then((res) => setDsChucVu(res.data));
  }, []);

  // Load danh sách nhân viên có lọc + tìm kiếm
  useEffect(() => {
    const fetchNhanVien = async () => {
      try {
        const res = await axios.get("http://localhost:5001/dsnhanvien", {
          params: {
            keyword: searchKeyword,
            ma_phongban: currentUser.ma_phongban,
            role: currentUser.role,
            filter_phongban: filterPhongBan,
            filter_trangthai: filterTrangThai,
            filter_chucvu: filterChucVu,
          },
        });
        setDsNhanVien(res.data);
      } catch (err) {
        console.error("Lỗi tải nhân viên:", err);
      }
    };
    if (isAdminOrManager) {
      fetchNhanVien();
    }
  }, [
    searchKeyword,
    currentUser.ma_phongban,
    currentUser.role,
    isAdminOrManager,
    filterPhongBan,
    filterTrangThai,
    filterChucVu,
  ]);

  // Gán mã nhân viên cho nhân viên thường
  useEffect(() => {
    if (!isAdminOrManager) {
      setFormData((prev) => ({
        ...prev,
        ma_nhanvien: currentUser.ma_nhanvien || "",
      }));
    }
  }, [currentUser.ma_nhanvien, isAdminOrManager]);

  // Load thông tin nhân viên khi chọn
  useEffect(() => {
    if (formData.ma_nhanvien) {
      setLoading(true);
      axios
        .get(`http://localhost:5001/nhansu/${formData.ma_nhanvien}`)
        .then((res) => setFormData((prev) => ({ ...prev, ...res.data })))
        .catch(() => setError("Không thể tải thông tin nhân viên."))
        .finally(() => setLoading(false));
    }
  }, [formData.ma_nhanvien]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!currentUser?.ma_nhanvien) {
      setError("Không xác định được người thực hiện. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    if (
      formData.role === "quan ly" &&
      currentUser.role !== "admin" &&
      !isNhanVienView
    ) {
      setError("Chỉ admin mới được phép chỉnh sửa tài khoản quản lý!");
      setLoading(false);
      return;
    }

    if (formData.role === "admin" && currentUser.role !== "admin") {
      setError("Chỉ admin mới được phép chỉnh sửa tài khoản này!");
      setLoading(false);
      return;
    }

    if (
      formData.ngay_sinh &&
      formData.ngay_vao_lam &&
      new Date(formData.ngay_sinh) >= new Date(formData.ngay_vao_lam)
    ) {
      setError("Ngày sinh phải trước ngày vào làm.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        nguoi_thuchien: currentUser?.ma_nhanvien || "unknown",
        ma_nhanvien_nguoi_tao: currentUser?.ma_nhanvien,
        role_nguoi_tao: currentUser?.role,
        ma_phongban_nguoi_tao: currentUser?.ma_phongban,
        isNhanVienView,
      };

      const response = await axios.put(
        `http://localhost:5001/nhansu/${formData.ma_nhanvien}`,
        payload
      );

      if (response.status === 200 && response.data?.message) {
        setSuccess(" " + response.data.message);
        setError("");
        onSuccess && onSuccess();
      } else {
        setError(" Cập nhật không rõ trạng thái từ server.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Lỗi không xác định khi gửi yêu cầu.";
      setError("" + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CContainer className="mt-4">
      <CRow className="justify-content-center">
        <CCol md={8}>
          <CCard>
            <CCardBody>
              <h4 className="text-center">Cập nhật nhân sự</h4>
              {error && <CAlert color="danger">{error}</CAlert>}
              {success && <CAlert color="success">{success}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                {isAdminOrManager ? (
                  <>
                    <CFormInput
                      label="Tìm kiếm nhân viên (mã hoặc tên)"
                      placeholder="Nhập để tìm..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="mb-2"
                    />

                    <CFormSelect
                      label="Lọc theo phòng ban"
                      value={filterPhongBan}
                      onChange={(e) => setFilterPhongBan(e.target.value)}
                      className="mb-2"
                    >
                      <option value="">-- Tất cả phòng ban --</option>
                      {dsPhongBan.map((pb) => (
                        <option key={pb.ma_phongban} value={pb.ma_phongban}>
                          {pb.ten_phongban}
                        </option>
                      ))}
                    </CFormSelect>

                    <CFormSelect
                      label="Lọc theo trạng thái"
                      value={filterTrangThai}
                      onChange={(e) => setFilterTrangThai(e.target.value)}
                      className="mb-2"
                    >
                      <option value="">-- Tất cả trạng thái --</option>
                      <option value="1">Đang làm</option>
                      <option value="0">Nghỉ làm</option>
                    </CFormSelect>

                    <CFormSelect
                      label="Lọc theo chức vụ"
                      value={filterChucVu}
                      onChange={(e) => setFilterChucVu(e.target.value)}
                      className="mb-3"
                    >
                      <option value="">-- Tất cả chức vụ --</option>
                      {dsChucVu.map((cv) => (
                        <option key={cv.ma_chucvu} value={cv.ma_chucvu}>
                          {cv.ten_chucvu}
                        </option>
                      ))}
                    </CFormSelect>

                    <CFormSelect
                      label="Chọn mã nhân viên"
                      name="ma_nhanvien"
                      value={formData.ma_nhanvien}
                      onChange={handleChange}
                      className="mb-3"
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {dsNhanVien.map((nv) => (
                        <option key={nv.ma_nhanvien} value={nv.ma_nhanvien}>
                          {nv.ma_nhanvien} - {nv.ho} {nv.ten}
                        </option>
                      ))}
                    </CFormSelect>
                  </>
                ) : (
                  <CFormInput
                    label="Mã nhân viên"
                    name="ma_nhanvien"
                    value={formData.ma_nhanvien}
                    disabled
                    className="mb-3"
                  />
                )}

                {!isNhanVienView && (
                  <CFormInput
                    label="Họ"
                    name="ho"
                    value={formData.ho}
                    onChange={handleChange}
                    className="mb-3"
                  />
                )}

                <CFormInput
                  label="Tên"
                  name="ten"
                  value={formData.ten}
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

                {!isNhanVienView && (
                  <>
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
                    <CFormSelect
                      label="Phòng ban"
                      name="ten_phongban"
                      value={formData.ten_phongban}
                      onChange={handleChange}
                      className="mb-3"
                    >
                      <option value="">-- Chọn phòng ban --</option>
                      {dsPhongBan.map((pb) => (
                        <option key={pb.ma_phongban} value={pb.ten_phongban}>
                          {pb.ten_phongban}
                        </option>
                      ))}
                    </CFormSelect>
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
                  </>
                )}

                <CFormInput
                  label="Số điện thoại"
                  name="sdt"
                  value={formData.sdt}
                  onChange={handleChange}
                  className="mb-3"
                />

                <CButton type="submit" color="primary" disabled={loading}>
                  {loading ? "Đang cập nhật..." : "Cập nhật"}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default EmployeeForm;
