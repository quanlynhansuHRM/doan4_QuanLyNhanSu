import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CCard, CCardHeader, CCardBody, CSpinner } from "@coreui/react";

const COLORS = ["#007bff", "#ffc107", "#28a745", "#6c757d"];

const ThongKeCongViec = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5015/congviec");
        const counts = {};
        res.data.forEach((task) => {
          counts[task.trang_thai] = (counts[task.trang_thai] || 0) + 1;
        });
        const chartData = Object.entries(counts).map(([name, value]) => ({
          name,
          value,
        }));
        setData(chartData);
      } catch (err) {
        console.error(" Lỗi lấy thống kê:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <CCard className="shadow-sm">
      <CCardHeader>
        <h5>📊 Thống kê trạng thái công việc</h5>
      </CCardHeader>
      <CCardBody
        className="d-flex justify-content-center align-items-center"
        style={{ height: 300 }}
      >
        {loading ? (
          <CSpinner color="primary" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CCardBody>
    </CCard>
  );
};

export default ThongKeCongViec;
