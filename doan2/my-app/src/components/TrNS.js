import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CNavItem,
  CNavTitle,
  CButton,
  CContainer,
} from "@coreui/react";

export const TrNhanVien = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const maNhanVien = user?.ma_nhanvien;
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "row" }}>
      <CSidebar
        className="border-end d-none d-md-flex"
        colorScheme="dark"
        visible={true}
      >
        <CSidebarHeader className="justify-content-center">
          <CSidebarBrand className="text-white">Trang nhân sự</CSidebarBrand>
        </CSidebarHeader>

        <CSidebarNav>
          <CNavTitle>Thông tin cá nhân</CNavTitle>
          <CNavItem active={isActive("nhan-su")}>
            {" "}
            <NavLink to={`nhan-su/${maNhanVien}`} className="nav-link">
              Xem thông tin
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("edit")}>
            {" "}
            <NavLink to={`edit/${maNhanVien}`} className="nav-link">
              Sửa thông tin
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("don_xinnghi")}>
            {" "}
            <NavLink to={`don_xinnghi`} className="nav-link">
              Đơn xin nghỉ
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("don-cua-toi")}>
            {" "}
            <NavLink to={`don-cua-toi`} className="nav-link">
              Trạng thái đơn
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("themanh")}>
            {" "}
            <NavLink to={`themanh`} className="nav-link">
              Cập nhật ảnh
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("xemlichlamvieccanhan")}>
            {" "}
            <NavLink
              to={`xemlichlamvieccanhan/${maNhanVien}`}
              className="nav-link"
            >
              Xem lịch làm
            </NavLink>{" "}
          </CNavItem>

          {/* <CNavTitle>Chấm công & Lương</CNavTitle>
          <CNavItem active={isActive("chamcong")}>
            {" "}
            <NavLink to={`chamcong`} className="nav-link">
              Chấm công
            </NavLink>{" "}
          </CNavItem> */}
          <CNavItem active={isActive("luong")}>
            {" "}
            <NavLink to={`luong`} className="nav-link">
              Xem lương
            </NavLink>{" "}
          </CNavItem>
          <CNavTitle>Tài khoản</CNavTitle>
          <CNavItem>
            <NavLink to="/" className="nav-link">
              Đăng xuất
            </NavLink>
          </CNavItem>
        </CSidebarNav>
      </CSidebar>

      <div style={{ flex: 1, padding: "1rem" }}>
        <div className="d-md-none mb-2">
          <CButton onClick={() => setSidebarVisible(!sidebarVisible)}>
            ☰ Menu
          </CButton>
        </div>
        <CContainer fluid>
          <Outlet />
        </CContainer>
      </div>
    </div>
  );
};

export default TrNhanVien;
