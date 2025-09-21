import React, { useEffect, useState } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
} from "@coreui/react";

const LichSuDon = () => {
  const [donList, setDonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchLichSu = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5014/don_xinnghi/daxuly?role=${currentUser.role}&ma_phongban=${currentUser.ma_phongban}`
        );
        const data = await res.json();
        setDonList(data);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử đơn:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLichSu();
  }, [currentUser.role, currentUser.ma_phongban]);

  return (
    <CCard className="mt-4">
      <CCardHeader className="fs-5 fw-bold text-center">
        Lịch sử đơn nghỉ phép đã xử lý
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner color="primary" />
          </div>
        ) : donList.length === 0 ? (
          <p className="text-center">Không có đơn nào đã xử lý.</p>
        ) : (
          <CTable hover responsive bordered align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Mã NV</CTableHeaderCell>
                <CTableHeaderCell>Tên</CTableHeaderCell>
                <CTableHeaderCell>Ngày nghỉ</CTableHeaderCell>
                <CTableHeaderCell>Loại nghỉ</CTableHeaderCell>
                <CTableHeaderCell>Ca nghỉ</CTableHeaderCell>
                <CTableHeaderCell>Lý do</CTableHeaderCell>
                <CTableHeaderCell>Ngày gửi</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {donList.map((don, index) => (
                <CTableRow key={don.id}>
                  <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                  <CTableDataCell>{don.ma_nhanvien}</CTableDataCell>
                  <CTableDataCell>{don.ten}</CTableDataCell>
                  <CTableDataCell>
                    {new Date(don.ngay_nghi).toLocaleDateString("vi-VN")}
                  </CTableDataCell>
                  <CTableDataCell>{don.nghi_ca_hay_ngay}</CTableDataCell>
                  <CTableDataCell>
                    {don.nghi_ca_hay_ngay === "Ca" ? don.ca_nghi : "-"}
                  </CTableDataCell>
                  <CTableDataCell>{don.ly_do}</CTableDataCell>
                  <CTableDataCell>
                    {new Date(don.ngay_gui).toLocaleDateString("vi-VN")}
                  </CTableDataCell>
                  <CTableDataCell>{don.trang_thai}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  );
};

export default LichSuDon;
