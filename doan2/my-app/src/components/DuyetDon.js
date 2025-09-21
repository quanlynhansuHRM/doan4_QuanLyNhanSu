import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
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
  CButton,
  CSpinner,
  CAlert,
} from "@coreui/react";

const DuyetDon = () => {
  const [donList, setDonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    color: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const fetchDon = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5014/don_xinnghi/chuaduyet"
      );
      const data = await response.json();
      setDonList(data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn:", err);
      showAlert("Không thể tải danh sách đơn nghỉ phép.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ visible: true, message, color });
    setTimeout(() => {
      setAlert({ visible: false, message: "", color: "" });
    }, 3000);
  };

  const handleDuyet = async (id, trang_thai) => {
    try {
      const response = await fetch(`http://localhost:5014/don_xinnghi/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trang_thai,
          ma_nhanvien: currentUser.ma_nhanvien,
          ma_phongban: currentUser.ma_phongban,
          role: currentUser.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(data.message, "success");
        fetchDon();
      } else {
        showAlert(data.message || "Có lỗi xảy ra.", "danger");
      }
    } catch (err) {
      console.error("Lỗi khi duyệt đơn:", err);
      showAlert("Không thể kết nối máy chủ.", "danger");
    }
  };

  useEffect(() => {
    fetchDon();
  }, []);

  return (
    <CCard className="mt-4">
      <CCardHeader className="fs-5 fw-bold d-flex justify-content-between align-items-center">
        <span>Danh sách đơn nghỉ phép chờ duyệt</span>
        <NavLink
          to={`/${currentUser.role === "admin" ? "admin" : "quanly"}/LichSuDon`}
          className="btn btn-primary btn-sm"
        >
          Lịch sử duyệt đơn
        </NavLink>
      </CCardHeader>

      <CCardBody>
        {alert.visible && (
          <CAlert color={alert.color} dismissible>
            {alert.message}
          </CAlert>
        )}

        {loading ? (
          <div className="text-center">
            <CSpinner color="primary" />
          </div>
        ) : donList.length === 0 ? (
          <p className="text-center">Không có đơn nào chờ duyệt.</p>
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
                <CTableHeaderCell>Gửi lúc</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {donList.map((don, index) => {
                const userRole = currentUser.role?.trim();
                const userPhongban = currentUser.ma_phongban?.trim();
                const donPhongban = don.ma_phongban?.trim();

                const hasPermission =
                  (userRole === "quan ly" && userPhongban === donPhongban) ||
                  userRole === "admin";

                return (
                  <CTableRow key={don.id}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{don.ma_nhanvien}</CTableDataCell>
                    <CTableDataCell>{don.ten}</CTableDataCell>
                    <CTableDataCell>
                      {new Date(don.ngay_nghi).toLocaleDateString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </CTableDataCell>

                    <CTableDataCell>
                      {don.nghi_ca_hay_ngay || "Cả ngày"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {don.nghi_ca_hay_ngay === "Ca" ? don.ca_nghi : "-"}
                    </CTableDataCell>
                    <CTableDataCell>{don.ly_do}</CTableDataCell>
                    <CTableDataCell>
                      {new Date(don.ngay_gui).toLocaleDateString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </CTableDataCell>
                    <CTableDataCell>
                      {hasPermission ? (
                        <>
                          <CButton
                            color="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleDuyet(don.id, "Đã duyệt")}
                          >
                            Duyệt
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDuyet(don.id, "Từ chối")}
                          >
                            Từ chối
                          </CButton>
                        </>
                      ) : (
                        <span className="text-muted">Không có quyền</span>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                );
              })}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  );
};

export default DuyetDon;
