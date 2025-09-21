import React from "react";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  if (!user || !allowedRoles.includes(role)) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <h2> Bạn không có quyền truy cập vào trang này</h2>
        <p>Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là nhầm lẫn.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
