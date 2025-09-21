import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CRow,
  CCol,
  CFormSelect,
  CAlert,
} from "@coreui/react";

const TaoLichLamViec = () => {
  const navigate = useNavigate();
  const [danhSachNhanVien, setDanhSachNhanVien] = useState([]);
  const [lichLamViec, setLichLamViec] = useState({});
  const [thongBao, setThongBao] = useState({ type: "", message: "" });
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const CHUCVU_MAP = {
    CV01: "Admin",
    CV02: "Quản lý",
    CV03: "Nhân viên",
  };

  useEffect(() => {
    if (!currentUser?.ma_phongban) {
      setThongBao({ type: "danger", message: "Không tìm thấy mã phòng ban!" });
      return;
    }

    // Lấy danh sách nhân viên theo phòng ban
    axios
      .get(
        `http://localhost:5002/dsnhanvien?ma_phongban=${currentUser.ma_phongban}`
      )
      .then((response) => {
        setDanhSachNhanVien(response.data);
      })
      .catch(() =>
        setThongBao({
          type: "danger",
          message: "Lỗi khi tải danh sách nhân viên!",
        })
      );

    // Khởi tạo khung lịch trống
    const ngayTrongTuan = [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ nhật",
    ];
    const caLamViec = ["Sáng", "Chiều", "Tối"];
    let tempLich = {};
    ngayTrongTuan.forEach((ngay) => {
      tempLich[ngay] = {};
      caLamViec.forEach((ca) => {
        tempLich[ngay][ca] = [];
      });
    });
    setLichLamViec(tempLich);
  }, [currentUser?.ma_phongban]);

  const handleChange = (ngay, ca, selectedNhanVien) => {
    setLichLamViec((prev) => ({
      ...prev,
      [ngay]: {
        ...prev[ngay],
        [ca]: selectedNhanVien,
      },
    }));
  };

  const handleSave = () => {
    // Kiểm tra có chọn nhân viên không
    const coNhanVien = Object.values(lichLamViec).some((ngay) =>
      Object.values(ngay).some((ca) => ca.length > 0)
    );

    if (!coNhanVien) {
      setThongBao({
        type: "warning",
        message: "Bạn chưa chọn nhân viên cho ca nào!",
      });
      return;
    }

    axios
      .post("http://localhost:5002/lichlamviec", {
        lichLamViec,
        performedBy: {
          ma: currentUser?.ma_nhanvien,
          ten: `${currentUser?.ho} ${currentUser?.ten}`,
          chucvu: CHUCVU_MAP[currentUser?.ma_chucvu] || "Không rõ",
          phongban: currentUser?.ma_phongban,
        },
      })
      .then(() => {
        setThongBao({
          type: "success",
          message: " Lịch làm việc đã được lưu thành công!",
        });
        setTimeout(() => {
          if (currentUser.role === "quan ly") navigate("/quanly/xem_lich");
          else if (currentUser.role === "admin") navigate("/admin/xem_lich");
          else navigate("/");
        }, 1200);
      })
      .catch(() =>
        setThongBao({
          type: "danger",
          message: " Lỗi khi lưu lịch làm việc!",
        })
      );
  };

  const handleAutoSchedule = () => {
    axios
      .post("http://localhost:5002/tao-lich-tu-dong", {
        ma_phongban: currentUser?.ma_phongban,
        performedBy: {
          ma: currentUser?.ma_nhanvien,
          ten: `${currentUser?.ho} ${currentUser?.ten}`,
          chucvu: CHUCVU_MAP[currentUser?.ma_chucvu] || "Không rõ",
          phongban: currentUser?.ma_phongban,
        },
      })
      .then((res) => {
        setLichLamViec(res.data.lichTuDong);
        setThongBao({
          type: "success",
          message: "Đã tạo lịch tự động thành công!",
        });
      })
      .catch(() => {
        setThongBao({
          type: "danger",
          message: "Lỗi khi tạo lịch tự động!",
        });
      });
  };

  return (
    <div>
      <h4 className="mb-3">Tạo lịch làm việc</h4>

      {thongBao.message && (
        <CAlert color={thongBao.type} className="fw-bold">
          {thongBao.message}
        </CAlert>
      )}

      <CTable bordered responsive hover>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell className="bg-light text-center">
              Ca làm
            </CTableHeaderCell>
            {Object.keys(lichLamViec).map((ngay, index) => (
              <CTableHeaderCell
                key={index}
                className="text-center text-primary"
              >
                {ngay}
              </CTableHeaderCell>
            ))}
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {["Sáng", "Chiều", "Tối"].map((ca, index) => (
            <CTableRow key={index}>
              <CTableDataCell className="bg-warning text-center fw-bold">
                {ca}
              </CTableDataCell>
              {Object.keys(lichLamViec).map((ngay, idx) => (
                <CTableDataCell key={idx} className="text-center">
                  <CFormSelect
                    multiple
                    value={lichLamViec[ngay][ca] || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      handleChange(ngay, ca, selectedOptions);
                    }}
                  >
                    {danhSachNhanVien.map((nv) => (
                      <option key={nv.ma_nhanvien} value={nv.ma_nhanvien}>
                        {nv.ho} {nv.ten}
                      </option>
                    ))}
                  </CFormSelect>
                  <p className="mt-2 text-primary small">
                    Đã chọn: {lichLamViec[ngay][ca].length} nhân viên
                  </p>
                </CTableDataCell>
              ))}
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>

      <CRow className="mt-3">
        <CCol className="text-start">
          <CButton color="success" onClick={handleAutoSchedule}>
            Tạo lịch tự động
          </CButton>
        </CCol>
        <CCol className="text-end">
          <CButton color="primary" onClick={handleSave}>
            Lưu & Xem lịch
          </CButton>
        </CCol>
      </CRow>
    </div>
  );
};

export default TaoLichLamViec;
