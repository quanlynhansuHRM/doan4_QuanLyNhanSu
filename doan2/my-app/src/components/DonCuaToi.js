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
  CButton,
  CBadge,
  CAlert,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
} from "@coreui/react";

const DonCuaToi = () => {
  const [donList, setDonList] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [donIdToDelete, setDonIdToDelete] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const maNV = user?.ma_nhanvien;

  const fetchDon = async () => {
    setErrorMsg("");
    try {
      const response = await fetch(
        `http://localhost:5014/don_xinnghi/theo-nv/${maNV}`
      );
      const data = await response.json();
      setDonList(data);
    } catch (err) {
      console.error("Lỗi lấy đơn:", err);
      setErrorMsg("Không thể tải danh sách đơn nghỉ. Vui lòng thử lại sau.");
    }
  };

  const handleDelete = async () => {
    if (!donIdToDelete) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(
        `http://localhost:5014/don_xinnghi/${donIdToDelete}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(data.message || "Đơn đã được hủy thành công.");
        fetchDon();
      } else {
        setErrorMsg(data.message || "Hủy đơn thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi hủy đơn:", err);
      setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.");
    } finally {
      setModalVisible(false);
      setDonIdToDelete(null);
    }
  };

  useEffect(() => {
    if (maNV) fetchDon();
  }, [maNV]);

  return (
    <>
      <CCard className="mt-4">
        <CCardHeader className="fs-5 fw-bold text-center">
          Đơn nghỉ phép của tôi
        </CCardHeader>
        <CCardBody>
          {errorMsg && <CAlert color="danger">{errorMsg}</CAlert>}
          {successMsg && <CAlert color="success">{successMsg}</CAlert>}

          <CTable hover responsive bordered align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Ngày nghỉ</CTableHeaderCell>
                <CTableHeaderCell>Lý do</CTableHeaderCell>
                <CTableHeaderCell>Gửi lúc</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {donList.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center">
                    Bạn chưa gửi đơn nghỉ nào.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                donList.map((don, index) => (
                  <CTableRow key={don.id}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>
                      {new Date(don.ngay_nghi).toLocaleDateString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </CTableDataCell>

                    <CTableDataCell>{don.ly_do}</CTableDataCell>
                    <CTableDataCell>
                      <CTableDataCell>
                        {new Date(don.ngay_gui).toLocaleDateString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </CTableDataCell>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge
                        color={
                          don.trang_thai === "Chờ duyệt"
                            ? "warning"
                            : don.trang_thai === "Đã duyệt"
                            ? "success"
                            : "danger"
                        }
                      >
                        {don.trang_thai}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      {don.trang_thai === "Chờ duyệt" ? (
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => {
                            setDonIdToDelete(don.id);
                            setModalVisible(true);
                          }}
                        >
                          Hủy đơn
                        </CButton>
                      ) : (
                        <span className="text-muted">Không thể hủy</span>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Modal xác nhận */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>Bạn có chắc muốn hủy đơn này?</CModalHeader>
        <CModalBody>Thao tác này sẽ không thể hoàn tác.</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Đóng
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            Xác nhận hủy
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default DonCuaToi;
