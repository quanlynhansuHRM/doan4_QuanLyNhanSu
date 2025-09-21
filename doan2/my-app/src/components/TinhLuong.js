import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CForm,
  CFormInput,
  CFormSelect,
  CFormLabel,
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

const TinhLuong = () => {
  const [ma_nhanvien, setMaNhanVien] = useState("");
  const [danhSachNV, setDanhSachNV] = useState([]);
  const [luongData, setLuongData] = useState(null);
  const [thuong, setThuong] = useState(0);
  const [phat, setPhat] = useState(0);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [role, setRole] = useState("");
  const [user, setUser] = useState(null);
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u) {
      setUser(u);
      setRole(u.role);
      if (u.role !== "admin" && u.role !== "quan ly") {
        setMaNhanVien(u.ma_nhanvien || "");
      } else {
        axios
          .post("http://localhost:5012/dsnhanvien-tinhluong", {
            role: u.role,
            ma_phongban: u.ma_phongban,
          })
          .then((res) => setDanhSachNV(res.data))
          .catch((err) => {
            console.error("Lỗi lấy danh sách nhân viên:", err);
          });
      }
    }

    const today = new Date();
    setThang(today.getMonth() + 1);
    setNam(today.getFullYear());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "ma_nhanvien") setMaNhanVien(value);
    else if (name === "thuong") setThuong(value);
    else if (name === "phat") setPhat(value);
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ma_nhanvien) {
      setError("Vui lòng chọn mã nhân viên.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5012/luong/${ma_nhanvien}?thuong=${thuong}&phat=${phat}&thang=${thang}&nam=${nam}`
      );
      setLuongData(res.data);
      setSuccessMsg("Tính lương thành công");
    } catch (err) {
      console.error("Lỗi khi tính lương:", err);
      setError("Không thể lấy dữ liệu lương.");
    }
  };

  const handleExport = async () => {
    if (!user || !user.role) {
      alert("Không xác định được vai trò người dùng.");
      return;
    }

    const body = {
      role: user.role,
      thang,
      nam,
      ma_nhanvien: user.ma_nhanvien, // người xuất file (cho log)
      ten: user.ten, // tên người xuất file (cho log)
    };

    // Quản lý cần thêm mã phòng ban để lọc nhân viên
    if (user.role === "quan ly") {
      body.ma_phongban = user.ma_phongban;
    }

    // Nếu admin hoặc quản lý chọn mã nhân viên cụ thể
    if ((user.role === "admin" || user.role === "quan ly") && ma_nhanvien) {
      body.loc_theo_ma_nhanvien = ma_nhanvien;
    }

    try {
      const response = await fetch("http://localhost:5012/xuat-luong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Không thể xuất file Excel.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bang_luong_${thang}_${nam}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi xuất file:", err);
      alert("Xuất file thất bại.");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

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
    <CContainer className="mt-4">
      <CRow className="justify-content-center">
        <CCol md={10}>
          <CCard>
            <CCardBody>
              {error && <CAlert color="danger">{error}</CAlert>}
              {successMsg && <CAlert color="success">{successMsg}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                <CRow>
                  <CCol md={4}>
                    <CFormLabel>Tháng</CFormLabel>
                    <CFormSelect
                      value={thang}
                      onChange={(e) => setThang(Number(e.target.value))}
                    >
                      {renderOptions(1, 12)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Năm</CFormLabel>
                    <CFormSelect
                      value={nam}
                      onChange={(e) => setNam(Number(e.target.value))}
                    >
                      {renderOptions(2023, new Date().getFullYear())}
                    </CFormSelect>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Mã nhân viên</CFormLabel>
                    {role === "admin" || role === "quan ly" ? (
                      <CFormSelect
                        name="ma_nhanvien"
                        value={ma_nhanvien}
                        onChange={handleChange}
                      >
                        <option value="">-- Chọn nhân viên --</option>
                        {danhSachNV.map((nv) => (
                          <option key={nv.ma_nhanvien} value={nv.ma_nhanvien}>
                            {nv.ma_nhanvien} - {nv.ho} {nv.ten}
                          </option>
                        ))}
                      </CFormSelect>
                    ) : (
                      <CFormInput
                        name="ma_nhanvien"
                        value={ma_nhanvien}
                        disabled
                      />
                    )}
                  </CCol>
                </CRow>

                <CRow className="mt-3">
                  <CCol md={6}>
                    <CFormInput
                      label="Thưởng (VND)"
                      type="number"
                      name="thuong"
                      value={thuong}
                      onChange={handleChange}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormInput
                      label="Phạt (VND)"
                      type="number"
                      name="phat"
                      value={phat}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>

                <CRow className="mt-3">
                  <CCol md={6}>
                    <CButton type="submit" color="success">
                      Tính lương
                    </CButton>
                  </CCol>
                  <CCol md={6} className="text-end">
                    <CButton color="primary" onClick={handleExport}>
                      Xuất Excel
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>

              {luongData && (
                <CTable className="mt-4" striped>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Tháng</CTableHeaderCell>
                      <CTableHeaderCell>Số công</CTableHeaderCell>
                      <CTableHeaderCell>Thưởng</CTableHeaderCell>
                      <CTableHeaderCell>Phạt</CTableHeaderCell>
                      <CTableHeaderCell>Tổng lương</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    <CTableRow>
                      <CTableDataCell>{luongData.thang}</CTableDataCell>
                      <CTableDataCell>{luongData.so_cong}</CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(luongData.thuong)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(luongData.phat)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(luongData.tong_luong)}
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default TinhLuong;
