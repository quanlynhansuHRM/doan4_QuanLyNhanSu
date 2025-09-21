import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "@coreui/coreui/dist/css/coreui.min.css";

import TinhLuong from "./components/TinhLuong";
import XemBangCong from "./components/XemBangCong";
import ChamCong from "./components/ChamCong";

import Login from "./components/Login";
import AdminPage from "./components/TrAD";
import TrPhongBan from "./components/TrPB";
import TrNhanVien from "./components/TrNS";
import TableExample from "./components/ds_nhansu";
import BieuDo from "./components/bieu_do";
import EmployeeDetail from "./components/ChiTietNhanSu";
import PhongBan from "./components/ds_PhongBan";
import PbChiTiet from "./components/PbChiTiet";
import FormChinhSuaNhanSu from "./components/FormChinhSuaNhanSu";
import XemLichLamViec from "./components/XemLich";
import TaoLichLamViec from "./components/tao_lich";
import FormThemNhanSu from "./components/Form_themnv";
import XemLichCaNhan from "./components/xemlichlamvieccanhan";
import ProtectedRoute from "./components/ktquyen";
import UploadAnhNhanVien from "./components/UploadAnhNhanVien";
import ThemPhongBanForm from "./components/formthempb";
import SuaPhongBanForm from "./components/capnhatPB";
import FormXinNghiPhep from "./components/FormXinNghiPhep";
import DuyetDon from "./components/DuyetDon";
import DonCuaToi from "./components/DonCuaToi";
import AuditLogTable from "./components/AuditLogTable";
import LichSuDon from "./components/LichSuDon";

function App() {
  const [schedule, setSchedule] = useState(null);

  return (
    <Router>
      <div style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route
            path="/quanly/xem_lich"
            element={
              <ProtectedRoute allowedRoles={["quan ly", "admin"]}>
                <XemLichLamViec schedule={schedule} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/xem_lich"
            element={
              <ProtectedRoute allowedRoles={["quan ly", "admin"]}>
                <XemLichLamViec schedule={schedule} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nhan-su/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "quan ly", "nhan_vien"]}>
                <EmployeeDetail />
              </ProtectedRoute>
            }
          />

          <Route path="phongban/:id" element={<PbChiTiet />} />
          <Route path="/thempb" element={<ThemPhongBanForm />} />
          <Route path="/admin/suaphongban/:id" element={<SuaPhongBanForm />} />

          {/* Route cho trang login */}
          <Route path="/" element={<Login />} />

          {/* Các Route cho Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          >
            <Route path="bieudo" element={<BieuDo />} />
            <Route
              path="xem_lich"
              element={<XemLichLamViec schedule={schedule} />}
            />
            <Route path="LichSuDon" element={<LichSuDon />} />
            <Route path="duyet-don" element={<DuyetDon />} />
            <Route path="auditlogs" element={<AuditLogTable />} />
            <Route path="edit/:id" element={<FormChinhSuaNhanSu />} />
            <Route path="nhan-su/:id" element={<EmployeeDetail />} />
            <Route path="ds_nhansu" element={<TableExample />} />
            <Route path="ds_PhongBan" element={<PhongBan />} />
            <Route path="themnhansu" element={<FormThemNhanSu />} />
            <Route path="phongban/:id" element={<PbChiTiet />} />
            <Route path="luong" element={<TinhLuong />} />
            <Route path="chamcong" element={<ChamCong />} />
            <Route path="xembangcong" element={<XemBangCong />} />
          </Route>

          {/* Các Route cho Trưởng phòng */}
          <Route
            path="/quanly"
            element={
              <ProtectedRoute allowedRoles={["quan ly"]}>
                <TrPhongBan />
              </ProtectedRoute>
            }
          >
            <Route path="LichSuDon" element={<LichSuDon />} />
            <Route path="duyet-don" element={<DuyetDon />} />
            <Route path="luong" element={<TinhLuong />} />
            <Route path="chamcong" element={<ChamCong />} />
            <Route path="xembangcong" element={<XemBangCong />} />

            <Route path="bieudo" element={<BieuDo />} />
            <Route path="themanh" element={<UploadAnhNhanVien />} />
            <Route path="themnhansu" element={<FormThemNhanSu />} />
            <Route
              path="xem_lich"
              element={<XemLichLamViec schedule={schedule} />}
            />
            <Route path="edit/:id" element={<FormChinhSuaNhanSu />} />
            <Route path="phongban/:id" element={<PbChiTiet />} />
            <Route path="nhan-su/:id" element={<EmployeeDetail />} />
            <Route
              path="tao_lich"
              element={<TaoLichLamViec onSave={setSchedule} />}
            />
          </Route>

          {/* Các Route cho Nhân viên */}
          <Route
            path="/nhan_vien"
            element={
              <ProtectedRoute allowedRoles={["nhan_vien"]}>
                <TrNhanVien />
              </ProtectedRoute>
            }
          >
            <Route path="don-cua-toi" element={<DonCuaToi />} />
            <Route path="don_xinnghi" element={<FormXinNghiPhep />} />
            <Route path="edit/:id" element={<FormChinhSuaNhanSu />} />
            <Route path="themanh" element={<UploadAnhNhanVien />} />
            <Route path="luong" element={<TinhLuong />} />
            <Route path="chamcong" element={<ChamCong />} />
            <Route path="xembangcong" element={<XemBangCong />} />
            <Route path="bieudo" element={<BieuDo />} />
            <Route
              path="xemlichlamvieccanhan/:maNhanVien"
              element={<XemLichCaNhan />}
            />
            <Route path="nhan-su/:id" element={<EmployeeDetail />} />
          </Route>

          {/* Đảm bảo người dùng không thể truy cập những route chưa định nghĩa */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
