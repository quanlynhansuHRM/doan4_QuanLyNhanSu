import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CCardText,
  CButton,
} from "@coreui/react";

const PhongBan = () => {
  const [phongBanList, setPhongBanList] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);

    axios
      .get("http://localhost:5005/dsphongban")
      .then((response) => {
        setPhongBanList(response.data);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu phòng ban:", error);
      });
  }, []);

  const getBasePath = () => {
    if (role === "admin") return "/admin";
    if (role === "quanly") return "/quanly";
    return "";
  };

  return (
    <div>
      <div className="d-flex justify-content-end gap-2 mb-4">
        <CButton
          as="a"
          href="/thempb"
          color="primary"
          className="rounded-pill px-4 shadow-sm"
        >
          <i className="bi bi-plus-circle me-2"></i> Thêm phòng ban
        </CButton>
        <CButton
          as="a"
          href="/admin/suaphongban/:id"
          color="info"
          className="rounded-pill px-4 shadow-sm"
        >
          <i className="bi bi-pencil-square me-2"></i> Chỉnh sửa phòng ban
        </CButton>
      </div>

      <CContainer>
        <h2 className="my-4">Danh sách phòng ban</h2>
        <CRow>
          {phongBanList.map((phong) => (
            <CCol xs={12} sm={6} md={4} key={phong.ma_phongban}>
              <CCard className="mb-3 shadow-sm">
                <CCardBody>
                  <CCardTitle>{phong.ten_phongban}</CCardTitle>
                  <CCardText>{phong.mo_ta}</CCardText>
                  <Link to={`${getBasePath()}/phongban/${phong.ma_phongban}`}>
                    <CButton color="primary">Xem chi tiết</CButton>
                  </Link>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CContainer>
    </div>
  );
};

export default PhongBan;
