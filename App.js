import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "@coreui/coreui/dist/css/coreui.min.css";
import ThongKeCongViec from "./components/ThongKeCongViec";
// import ThongBao from "./components/ThongBao";
import QLCongViec from "./components/QL_CongViec";
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
// import HopThoaiChat from "./components/HopThoaiChat";

function App() {
  const [schedule, setSchedule] = useState(null);

  const nguoiDungHienTai = JSON.parse(localStorage.getItem("user")) || {};

  const ma_nv =
    nguoiDungHienTai?.ma_nhanvien || nguoiDungHienTai?.ma_nv || null;

  return (
    <Router>
      <div style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* ------------------ ADMIN ------------------ */}
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
            {/*<Route path="thongbao" element={<ThongBao ma_nv={ma_nv} />} /> */}
            <Route path="quanly-congviec" element={<QLCongViec />} />
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
            {/*}  <Route
              path="chat"
              element={<HopThoaiChat nguoiDungHienTai={nguoiDungHienTai} />}
            /> */}
          </Route>

          {/* ------------------ QUẢN LÝ ------------------ */}
          <Route
            path="/quanly"
            element={
              <ProtectedRoute allowedRoles={["quan ly"]}>
                <TrPhongBan />
              </ProtectedRoute>
            }
          >
            {/*<Route path="thongbao" element={<ThongBao ma_nv={ma_nv} />} /> */}
            <Route path="quanly-congviec" element={<QLCongViec />} />
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
            {/* <Route
              path="chat"
              element={<HopThoaiChat nguoiDungHienTai={nguoiDungHienTai} />}
            /> */}
          </Route>

          {/* ------------------ NHÂN VIÊN ------------------ */}
          <Route
            path="/nhan_vien"
            element={
              <ProtectedRoute allowedRoles={["nhan_vien"]}>
                <TrNhanVien />
              </ProtectedRoute>
            }
          >
            {/*<Route path="thongbao" element={<ThongBao ma_nv={ma_nv} />} /> */}
            <Route path="quanly-congviec" element={<QLCongViec />} />
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
            {/* <Route
              path="chat"
              element={<HopThoaiChat nguoiDungHienTai={nguoiDungHienTai} />}
            />*/}
          </Route>

          {/* ------------------ KHÁC ------------------ */}
          <Route path="phongban/:id" element={<PbChiTiet />} />
          <Route path="/thempb" element={<ThemPhongBanForm />} />
          <Route path="/admin/suaphongban/:id" element={<SuaPhongBanForm />} />

          {/* ------------------ CHAT CHUNG ------------------ */}
          {/* <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["admin", "quan ly", "nhan_vien"]}>
                <HopThoaiChat nguoiDungHienTai={nguoiDungHienTai} />
              </ProtectedRoute>
            }
          />*/}

          {/* ------------------ FALLBACK ------------------ */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
