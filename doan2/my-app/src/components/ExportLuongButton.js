import React, { useState, useEffect } from "react";
import {
  CButton,
  CRow,
  CCol,
  CFormSelect,
  CFormLabel,
  CForm,
} from "@coreui/react";

const ExportLuongButton = () => {
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u) setUser(u);

    // Mặc định lấy tháng/năm hiện tại
    const today = new Date();
    setThang(today.getMonth() + 1);
    setNam(today.getFullYear());
  }, []);

  const handleExport = async (e) => {
    e.preventDefault();

    if (!user || !user.role) {
      alert("Không xác định được vai trò người dùng.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5012/xuat-luong", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: user.role,
          ma_nhanvien: user.ma_nhanvien,
          ma_phongban: user.ma_phongban,
          thang,
          nam,
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể xuất file Excel.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `bang_luong_${thang}_${nam}.xlsx`;
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi xuất file:", err);
      alert("Xuất file thất bại.");
    }
  };

  const renderOptions = (start, end) => {
    const options = [];
    for (let i = start; i <= end; i++) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return options;
  };

  return (
    <CForm onSubmit={handleExport} className="mt-4">
      <CRow className="align-items-end">
        <CCol xs={5}>
          <CFormLabel>Tháng</CFormLabel>
          <CFormSelect
            value={thang}
            onChange={(e) => setThang(Number(e.target.value))}
          >
            {renderOptions(1, 12)}
          </CFormSelect>
        </CCol>
        <CCol xs={5}>
          <CFormLabel>Năm</CFormLabel>
          <CFormSelect
            value={nam}
            onChange={(e) => setNam(Number(e.target.value))}
          >
            {renderOptions(2023, new Date().getFullYear())}
          </CFormSelect>
        </CCol>
        <CCol xs={2}>
          <CButton type="submit" color="primary">
            Xuất Excel
          </CButton>
        </CCol>
      </CRow>
    </CForm>
  );
};

export default ExportLuongButton;
