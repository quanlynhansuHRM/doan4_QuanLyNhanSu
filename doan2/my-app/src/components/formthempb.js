import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CRow,
  CCol,
  CAlert,
} from "@coreui/react";

const ThemPhongBanForm = () => {
  const [formData, setFormData] = useState({
    ma_phongban: "",
    ten_phongban: "",
    truongphong_id: "",
    ngay_thanh_lap: "",
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:5009/thempb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setFormData({
          ma_phongban: "",
          ten_phongban: "",
          truongphong_id: "",
          ngay_thanh_lap: "",
        });
      } else {
        setError(result.error || "Lỗi không xác định");
      }
    } catch (err) {
      setError("Không thể kết nối tới server.");
    }
  };

  return (
    <div>
      <CCard className="mt-4">
        <CCardHeader>Thêm Phòng Ban</CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Mã phòng ban *</CFormLabel>
                <CFormInput
                  type="text"
                  name="ma_phongban"
                  value={formData.ma_phongban}
                  onChange={handleChange}
                  required
                />
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
                  value={formData.ngay_thanh_lap}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>

            {message && <CAlert color="success">{message}</CAlert>}
            {error && <CAlert color="danger">{error}</CAlert>}

            <CButton type="submit" color="primary">
              Thêm phòng ban
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

export default ThemPhongBanForm;
