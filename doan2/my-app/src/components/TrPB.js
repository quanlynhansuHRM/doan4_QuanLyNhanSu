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

export const TrPhongBan = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const ma_phongban = user?.ma_phongban;
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
          <CSidebarBrand className="text-white">Quản lý nhân sự</CSidebarBrand>
        </CSidebarHeader>

        <CSidebarNav>
          <CNavTitle>Chức năng chung</CNavTitle>
          <CNavItem active={isActive("duyet-don")}>
            {" "}
            <NavLink to="duyet-don" className="nav-link">
              Duyệt đơn
            </NavLink>{" "}
          </CNavItem>
          {/* <CNavItem active={isActive("LichSuDon")}>
            {" "}
            <NavLink to="LichSuDon" className="nav-link">
              Lịch sử duyệt đơn
            </NavLink>{" "}
          </CNavItem> */}
          <CNavItem active={isActive("themanh")}>
            {" "}
            <NavLink to="themanh" className="nav-link">
              Cập nhật ảnh
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("edit")}>
            {" "}
            <NavLink to="edit/id" className="nav-link">
              Sửa thông tin
            </NavLink>{" "}
          </CNavItem>

          <CNavItem active={isActive("themnhansu")}>
            {" "}
            <NavLink to="themnhansu" className="nav-link">
              Thêm nhân sự
            </NavLink>{" "}
          </CNavItem>

          <CNavTitle>Phòng ban</CNavTitle>
          <CNavItem active={isActive("phongban")}>
            {" "}
            <NavLink to={`phongban/${ma_phongban}`} className="nav-link">
              Phòng ban
            </NavLink>{" "}
          </CNavItem>

          <CNavTitle>Lương & chấm công</CNavTitle>
          <CNavItem active={isActive("chamcong")}>
            {" "}
            <NavLink to="chamcong" className="nav-link">
              Chấm công
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("luong")}>
            {" "}
            <NavLink to="luong" className="nav-link">
              Xem lương
            </NavLink>{" "}
          </CNavItem>

          <CNavTitle>Lịch làm việc</CNavTitle>
          <CNavItem active={isActive("tao_lich")}>
            {" "}
            <NavLink to="tao_lich" className="nav-link">
              Tạo lịch
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("xem_lich")}>
            {" "}
            <NavLink to="xem_lich" className="nav-link">
              Xem lịch
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
        <div className="d-md-none mb-3 text-start">
          <CButton
            color="dark"
            variant="outline"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
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

export default TrPhongBan;
