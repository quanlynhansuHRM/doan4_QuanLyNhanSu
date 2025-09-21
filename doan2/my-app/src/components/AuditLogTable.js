import React, { useEffect, useState } from "react";
import axios from "axios";

const AuditLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setError("Bạn chưa đăng nhập");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (parsedUser.role !== "admin") {
      setError("Bạn không có quyền xem nhật ký hệ thống");
      return;
    }

    axios
      .get("http://localhost:5007/auditlogs", {
        params: {
          role: parsedUser.role,
          ma_nhanvien: parsedUser.ma_nhanvien,
        },
      })
      .then((res) => setLogs(res.data))
      .catch((err) => {
        console.error(err);
        setError("Không thể tải nhật ký truy vết");
      });
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Nhật ký truy vết hệ thống</h4>
      <table className="table table-bordered table-striped">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Hành động</th>
            <th>Bảng</th>
            <th>ID đối tượng</th>
            <th>Người thực hiện</th>
            <th>Thời gian</th>
            <th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id}>
              <td>{index + 1}</td>
              <td>{log.action_type}</td>
              <td>{log.table_name}</td>
              <td>{log.record_id || "-"}</td>
              <td>{log.performed_by}</td>
              <td>{new Date(log.performed_at).toLocaleString("vi-VN")}</td>

              <td>
                <pre style={{ margin: 0, fontSize: "0.8em" }}>
                  {JSON.stringify(JSON.parse(log.changes), null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
