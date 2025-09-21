import React, { useState } from "react";
import axios from "axios";
import {
  CForm,
  CFormInput,
  CButton,
  CContainer,
  CAlert,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from "@coreui/react";

const XemBangCong = () => {
  const [formData, setFormData] = useState({
    ma_nhanvien: "",
    thang: "",
    nam: "",
  });

  const [chamCongData, setChamCongData] = useState([]);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.ma_nhanvien || !formData.thang || !formData.nam) {
        setError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const res = await axios.get(
        `http://localhost:5011/xemchamcong?ma_nhanvien=${formData.ma_nhanvien}&thang=${formData.thang}&nam=${formData.nam}`
      );
      setChamCongData(res.data);
      setError("");
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu chấm công:", err);
      setError("Không thể lấy dữ liệu chấm công.");
    }
  };

  return (
    <CContainer className="mt-4">
      <CRow className="justify-content-center">
        <CCol md={8}>
          <CCard>
            <CCardBody>
              {error && <CAlert color="danger">{error}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                <CFormInput
                  label="Mã nhân viên"
                  name="ma_nhanvien"
                  value={formData.ma_nhanvien}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormInput
                  label="Tháng"
                  type="number"
                  name="thang"
                  value={formData.thang}
                  onChange={handleChange}
                  className="mb-3"
                />
                <CFormInput
                  label="Năm"
                  type="number"
                  name="nam"
                  value={formData.nam}
                  onChange={handleChange}
                  className="mb-3"
                />

                <CButton type="submit" color="primary">
                  Xem bảng công
                </CButton>
              </CForm>

              <CTable className="mt-4" striped>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Ngày</CTableHeaderCell>
                    <CTableHeaderCell>Check-in</CTableHeaderCell>
                    <CTableHeaderCell>Check-out</CTableHeaderCell>
                    <CTableHeaderCell>Ghi chú</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {chamCongData.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>{item.ngay}</CTableDataCell>
                      <CTableDataCell>{item.check_in}</CTableDataCell>
                      <CTableDataCell>{item.check_out}</CTableDataCell>
                      <CTableDataCell>{item.ghi_chu}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default XemBangCong;
