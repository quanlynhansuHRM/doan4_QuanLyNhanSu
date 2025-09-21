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

export const AdminPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
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
          <CSidebarBrand className="text-white">Admin</CSidebarBrand>
        </CSidebarHeader>

        <CSidebarNav>
          <CNavTitle>Quản lý phòng ban</CNavTitle>
          <CNavItem active={isActive("ds_PhongBan")}>
            {" "}
            <NavLink to="ds_PhongBan" className="nav-link">
              Danh sách phòng ban
            </NavLink>{" "}
          </CNavItem>

          <CNavTitle>Quản lý nhân sự</CNavTitle>
          <CNavItem active={isActive("themnhansu")}>
            {" "}
            <NavLink to="themnhansu" className="nav-link">
              Thêm nhân sự
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("edit")}>
            {" "}
            <NavLink to="edit/id" className="nav-link">
              Sửa thông tin
            </NavLink>{" "}
          </CNavItem>
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
          <CNavItem active={isActive("xem_lich")}>
            {" "}
            <NavLink to="xem_lich" className="nav-link">
              Lịch làm việc chung
            </NavLink>{" "}
          </CNavItem>
          {
            <CNavItem active={isActive("chamcong")}>
              {" "}
              <NavLink to="chamcong" className="nav-link">
                Chấm công
              </NavLink>{" "}
            </CNavItem>
          }
          <CNavItem active={isActive("luong")}>
            {" "}
            <NavLink to="luong" className="nav-link">
              Xem lương
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("ds_nhansu")}>
            {" "}
            <NavLink to="ds_nhansu" className="nav-link">
              Danh sách nhân sự
            </NavLink>{" "}
          </CNavItem>

          <CNavTitle>Thống kê</CNavTitle>
          <CNavItem active={isActive("bieudo")}>
            {" "}
            <NavLink to="bieudo" className="nav-link">
              Xem biểu đồ
            </NavLink>{" "}
          </CNavItem>
          <CNavItem active={isActive("auditlogs")}>
            {" "}
            <NavLink to="auditlogs" className="nav-link">
              Lịch sử truy vết
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

export default AdminPage;
