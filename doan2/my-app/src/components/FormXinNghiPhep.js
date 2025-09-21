import React, { useState, useEffect } from "react";
import {
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CRow,
  CCol,
  CAlert,
  CFormSelect,
} from "@coreui/react";

const FormXinNghiPhep = () => {
  const [userInfo, setUserInfo] = useState({ ma_nhanvien: "", ten: "" });
  const [ngayNghi, setNgayNghi] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [nghiCaHayNgay, setNghiCaHayNgay] = useState("Cả ngày");
  const [caNghi, setCaNghi] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser) {
      setUserInfo({
        ma_nhanvien: currentUser.ma_nhanvien || "",
        ten: currentUser.ten || "",
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (nghiCaHayNgay === "Ca" && !caNghi) {
      setErrorMsg("Vui lòng chọn ca muốn nghỉ.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5014/don_xinnghi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ma_nhanvien: userInfo.ma_nhanvien,
          ten: userInfo.ten,
          ngay_nghi: ngayNghi,
          ly_do: lyDo,
          nghi_ca_hay_ngay: nghiCaHayNgay,
          ca_nghi: nghiCaHayNgay === "Ca" ? caNghi : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Đơn xin nghỉ đã được gửi thành công.");
        setNgayNghi("");
        setLyDo("");
        setNghiCaHayNgay("Cả ngày");
        setCaNghi("");
      } else {
        setErrorMsg(data.message || "Gửi đơn thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi gửi đơn:", error);
      setErrorMsg("Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại.");
    }
  };

  return (
    <CContainer fluid className="d-flex justify-content-center">
      <CRow className="w-100 justify-content-center mt-4">
        <CCol xs={12} sm={10} md={8} lg={6}>
          <CCard className="shadow rounded-4">
            <CCardHeader className="fs-5 fw-bold text-center py-3">
              Đơn xin nghỉ phép
            </CCardHeader>
            <CCardBody>
              {successMsg && <CAlert color="success">{successMsg}</CAlert>}
              {errorMsg && <CAlert color="danger">{errorMsg}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                <CFormInput
                  label="Mã nhân viên"
                  value={userInfo.ma_nhanvien}
                  disabled
                  className="mb-3"
                />
                <CFormInput
                  label="Tên"
                  value={userInfo.ten}
                  disabled
                  className="mb-3"
                />
                <CFormLabel>Ngày nghỉ</CFormLabel>
                <CFormInput
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={ngayNghi}
                  onChange={(e) => setNgayNghi(e.target.value)}
                  className="mb-3"
                  required
                />

                <CFormSelect
                  label="Loại nghỉ"
                  value={nghiCaHayNgay}
                  onChange={(e) => setNghiCaHayNgay(e.target.value)}
                  className="mb-3"
                >
                  <option value="Cả ngày">Cả ngày</option>
                  <option value="Ca">Chỉ nghỉ một ca</option>
                </CFormSelect>

                {nghiCaHayNgay === "Ca" && (
                  <CFormSelect
                    label="Ca muốn nghỉ"
                    value={caNghi}
                    onChange={(e) => setCaNghi(e.target.value)}
                    className="mb-3"
                    required
                  >
                    <option value="">-- Chọn ca --</option>
                    <option value="Sáng">Sáng</option>
                    <option value="Chiều">Chiều</option>
                    <option value="Tối">Tối</option>
                  </CFormSelect>
                )}

                <CFormTextarea
                  label="Lý do"
                  value={lyDo}
                  onChange={(e) => setLyDo(e.target.value)}
                  className="mb-4"
                  rows={4}
                  required
                />

                <div className="d-flex justify-content-end">
                  <CButton type="submit" color="primary">
                    Gửi đơn
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default FormXinNghiPhep;
