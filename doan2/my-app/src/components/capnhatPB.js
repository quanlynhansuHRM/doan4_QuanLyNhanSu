import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CRow,
  CCol,
  CAlert,
} from "@coreui/react";

const CapNhatPhongBanForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ma_phongban: "",
    ten_phongban: "",
    truongphong_id: "",
    ngay_thanh_lap: "",
  });

  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Gọi API để lấy danh sách phòng ban
  useEffect(() => {
    const fetchPhongBan = async () => {
      try {
        const res = await fetch("http://localhost:5005/dsphongban");
        const data = await res.json();
        setDsPhongBan(data);
      } catch (err) {
        console.error("Lỗi lấy phòng ban:", err);
      }
    };
    fetchPhongBan();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:5009/capnhat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) setMessage(result.message);
      else setError(result.error || "Lỗi không xác định");
    } catch (err) {
      setError("Không thể kết nối tới server.");
    }
  };

  return (
    <div>
      <CCard className="mt-4">
        <CCardHeader>Cập nhật Phòng Ban</CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Mã phòng ban cập nhật *</CFormLabel>
                <CFormSelect
                  name="ma_phongban"
                  value={formData.ma_phongban}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {dsPhongBan.map((pb) => (
                    <option key={pb.ma_phongban} value={pb.ma_phongban}>
                      {pb.ma_phongban} - {pb.ten_phongban}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Tên phòng ban *</CFormLabel>
                <CFormInput
                  type="text"
                  name="ten_phongban"
                  value={formData.ten_phongban}
                  onChange={handleChange}
                  required
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Trưởng phòng (ID)</CFormLabel>
                <CFormInput
                  type="text"
                  name="truongphong_id"
                  value={formData.truongphong_id}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Ngày thành lập</CFormLabel>
                <CFormInput
                  type="date"
                  name="ngay_thanh_lap"
                  value={formData.ngay_thanh_lap || ""}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>

            {message && <CAlert color="success">{message}</CAlert>}
            {error && <CAlert color="danger">{error}</CAlert>}

            <CButton type="submit" color="primary">
              Cập nhật phòng ban
            </CButton>
            <CButton
              color="secondary"
              className="ms-2"
              onClick={() => navigate(-1)}
            >
              Quay lại
            </CButton>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default CapNhatPhongBanForm;
