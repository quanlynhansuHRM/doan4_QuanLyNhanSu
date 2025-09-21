import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CCard,
  CCardBody,
  CImage,
  CFormInput,
  CButton,
  CAlert,
} from "@coreui/react";

function UploadAnhNhanVien() {
  const [base64Image, setBase64Image] = useState("");
  const [fileType, setFileType] = useState("");
  const [preview, setPreview] = useState(null);
  const [maNV, setMaNV] = useState("");
  const [anhTuServer, setAnhTuServer] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [role, setRole] = useState("");
  const [maNVFromUser, setMaNVFromUser] = useState("");

  // Lấy user từ localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.ma_nhanvien) {
      setMaNV(user.ma_nhanvien);
      setRole(user.role);
      setMaNVFromUser(user.ma_nhanvien);
      fetchAnh(user.ma_nhanvien);
    } else {
      setErrorMsg("Không tìm thấy thông tin người dùng trong localStorage.");
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const type = file.type.split("/")[1];
    setFileType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      setBase64Image(base64Data);
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    setSuccessMsg("");
    setErrorMsg("");

    if (!base64Image || !fileType) {
      setErrorMsg("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5008/themanh",
        {
          maNV: maNV,
          anhDaiDien: base64Image,
          dinhDang: fileType,
          role: role,
        },
        {
          headers: {
            Authorization: maNVFromUser,
          },
        }
      );

      setSuccessMsg("Tải ảnh thành công!");
      setErrorMsg("");
      fetchAnh(maNV);
    } catch (err) {
      console.error(err);
      setErrorMsg("Đã xảy ra lỗi khi tải ảnh. Vui lòng thử lại.");
      setSuccessMsg("");
    }
  };

  const fetchAnh = async (maNVToFetch) => {
    try {
      const res = await axios.get(
        `http://localhost:5008/themanh/${maNVToFetch}`
      );
      setAnhTuServer(res.data.anhDaiDienFull);
    } catch (err) {
      console.error("Lỗi khi lấy ảnh từ server", err);
    }
  };

  return (
    <CCard className="p-3" style={{ maxWidth: 500, margin: "auto" }}>
      <CCardBody>
        <h4 className="text-center mb-3">Tải ảnh nhân viên</h4>

        {successMsg && <CAlert color="success">{successMsg}</CAlert>}
        {errorMsg && <CAlert color="danger">{errorMsg}</CAlert>}

        {/* Input mã nhân viên - chỉ khóa nếu là nhân viên */}
        <CFormInput
          type="text"
          label="Mã nhân viên"
          value={maNV}
          onChange={(e) => setMaNV(e.target.value)}
          disabled={role === "nhan_vien"}
          className="mb-3"
        />

        <CFormInput
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-3"
        />

        {preview && (
          <div className="text-center mb-3">
            <CImage src={preview} alt="Preview" width="150" />
          </div>
        )}

        <CButton color="primary" className="w-100 mb-3" onClick={handleUpload}>
          Tải lên
        </CButton>

        {anhTuServer && (
          <div className="text-center">
            <h5>Ảnh từ server:</h5>
            <CImage src={anhTuServer} alt="Ảnh nhân viên" width="150" />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
}

export default UploadAnhNhanVien;
