import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CContainer,
  CRow,
  CCol,
} from "@coreui/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [maNhanVien, setMaNhanVien] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const CHUCVU_MAP = {
    CV01: "Admin",
    CV02: "Quản lý",
    CV03: "Nhân viên",
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    toast.dismiss();

    try {
      const response = await axios.post("http://localhost:5007/login", {
        ma_nhanvien: maNhanVien,
        password: password,
      });

      const user = response.data.user;
      const tenPhongBan = response.data.ma_phongban;
      const maChucVu = user.ma_chucvu;
      user.chucvu = CHUCVU_MAP[user.ma_chucvu] || "Không rõ";

      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Đăng nhập thành công!", { autoClose: 2000 });

      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "quan ly") {
          navigate("/quanly");
        } else {
          navigate("/nhan_vien");
        }
      }, 1000);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          toast.error("Sai mã nhân viên hoặc mật khẩu!");
        } else if (err.response.status === 403) {
          toast.error("Tài khoản đã bị dừng hoạt động!");
        } else {
          toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
        }
      } else {
        toast.error("Không thể kết nối tới máy chủ.");
      }
      console.error("Lỗi đăng nhập:", err);
    }
  };

  return (
    <CContainer className="vh-100 d-flex justify-content-center align-items-center">
      <ToastContainer position="top-center" />
      <CRow className="w-100 justify-content-center">
        <CCol md={6} lg={4}>
          <CCard>
            <CCardHeader>
              <h4 className="text-center">Đăng nhập</h4>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleLogin}>
                <div className="mb-3">
                  <CFormLabel htmlFor="maNhanVien">Mã nhân viên</CFormLabel>
                  <CFormInput
                    type="text"
                    id="maNhanVien"
                    value={maNhanVien}
                    onChange={(e) => setMaNhanVien(e.target.value)}
                    required
                    placeholder="Nhập mã nhân viên"
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="password">Mật khẩu</CFormLabel>
                  <CFormInput
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                <CButton type="submit" color="primary" className="w-100">
                  Đăng nhập
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default Login;
