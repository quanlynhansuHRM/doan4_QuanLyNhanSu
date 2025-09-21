import React, { useEffect, useState } from "react";
import {
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CWidgetStatsA,
} from "@coreui/react";
import { CChart } from "@coreui/react-chartjs";

const BieuDo = () => {
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [salaryByMonth, setSalaryByMonth] = useState([]);
  const [salaryByDeptAndMonth, setSalaryByDeptAndMonth] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5003/thongke")
      .then((res) => res.json())
      .then((data) => setEmployeeStats(data))
      .catch((err) => console.error("Lỗi thống kê nhân viên", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5003/luong_theo_thang")
      .then((res) => res.json())
      .then((data) => setSalaryByMonth(data))
      .catch((err) => console.error("Lỗi lương theo tháng", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5003/luong_theo_phongban_thang")
      .then((res) => res.json())
      .then((data) => setSalaryByDeptAndMonth(data))
      .catch((err) =>
        console.error("Lỗi lương theo phòng ban theo tháng", err)
      );
  }, []);

  //lương theo tháng
  const monthLabels = salaryByMonth.map((item) => `T${item.thang}/${item.nam}`);
  const salaryData = salaryByMonth.map((item) => item.tong_luong_thang);

  //theo phòng ban
  const phongBanSet = new Set();
  const thangNamSet = new Set();

  salaryByDeptAndMonth.forEach((item) => {
    phongBanSet.add(item.ten_phongban);
    thangNamSet.add(`T${item.thang}/${item.nam}`);
  });

  const phongBanList = Array.from(phongBanSet);
  const thangNamList = Array.from(thangNamSet);

  const datasetsByDept = phongBanList.map((phongban) => {
    const data = thangNamList.map((time) => {
      const [thang, nam] = time.replace("T", "").split("/");
      const found = salaryByDeptAndMonth.find(
        (item) =>
          item.ten_phongban === phongban &&
          String(item.thang) === thang &&
          String(item.nam) === nam
      );
      return found ? found.tong_luong : 0;
    });

    return {
      label: phongban,
      backgroundColor: "#" + Math.floor(Math.random() * 16777215).toString(16), // random màu
      data,
    };
  });

  return (
    <CRow>
      {/* Widget thống kê nhân viên */}
      <CCol md={4}>
        <CWidgetStatsA
          color="primary"
          title="Tổng nhân viên"
          value={employeeStats.total}
        />
        <CWidgetStatsA
          color="success"
          title="Đang làm việc"
          value={employeeStats.active}
        />
        <CWidgetStatsA
          color="danger"
          title="Đã nghỉ việc"
          value={employeeStats.inactive}
        />
      </CCol>

      {/* Biểu đồ lương theo tháng */}
      <CCol md={8}>
        <CCard>
          <CCardHeader>Lương theo tháng</CCardHeader>
          <CCardBody>
            <CChart
              type="line"
              data={{
                labels: monthLabels,
                datasets: [
                  {
                    label: "Tổng lương",
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    data: salaryData,
                    fill: true,
                  },
                ],
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>

      {/* Biểu đồ lương theo phòng ban theo tháng */}
      <CCol md={12} className="mt-4">
        <CCard>
          <CCardHeader>Lương theo phòng ban theo tháng</CCardHeader>
          <CCardBody>
            <CChart
              type="bar"
              data={{
                labels: thangNamList,
                datasets: datasetsByDept,
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default BieuDo;
