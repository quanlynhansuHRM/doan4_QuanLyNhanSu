import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
} from "@coreui/react";

const XemLichLamViec = () => {
  const [schedule, setSchedule] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5002/xemlichlamviec")
      .then((response) => {
        const rawData = response.data;

        const formattedSchedule = {
          "Thứ 2": { Sáng: [], Chiều: [], Tối: [] },
          "Thứ 3": { Sáng: [], Chiều: [], Tối: [] },
          "Thứ 4": { Sáng: [], Chiều: [], Tối: [] },
          "Thứ 5": { Sáng: [], Chiều: [], Tối: [] },
          "Thứ 6": { Sáng: [], Chiều: [], Tối: [] },
          "Thứ 7": { Sáng: [], Chiều: [], Tối: [] },
          "Chủ nhật": { Sáng: [], Chiều: [], Tối: [] },
        };

        rawData.forEach(({ ho, ten, day_of_week, shift, ghi_chu }) => {
          const dayKey = day_of_week?.trim();
          const shiftKey = shift?.includes("Sáng")
            ? "Sáng"
            : shift?.includes("Chiều")
            ? "Chiều"
            : shift?.includes("Tối")
            ? "Tối"
            : null;

          if (dayKey && shiftKey && formattedSchedule[dayKey]?.[shiftKey]) {
            formattedSchedule[dayKey][shiftKey].push({
              name: [ho, ten].filter(Boolean).join(" "),
              ghi_chu: ghi_chu || (shift.includes("(Nghỉ)") ? "Nghỉ" : ""),
            });
          }
        });

        setSchedule(formattedSchedule);
      })
      .catch((error) => console.error("Lỗi tải lịch làm việc:", error));
  }, []);

  if (
    !schedule ||
    Object.values(schedule).every((day) =>
      Object.values(day).every((ca) => ca.length === 0)
    )
  ) {
    return <p className="text-danger">Chưa có lịch nào được lưu!</p>;
  }

  return (
    <div>
      <CButton color="secondary" onClick={() => navigate(-1)} className="mb-3">
        Quay lại
      </CButton>

      <h4 className="mb-3">Lịch làm việc theo tuần</h4>
      <CTable bordered responsive hover>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell className="bg-light text-center">
              Ca làm
            </CTableHeaderCell>
            {Object.keys(schedule).map((day, index) => (
              <CTableHeaderCell
                key={index}
                className="text-center text-primary"
              >
                {day}
              </CTableHeaderCell>
            ))}
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {["Sáng", "Chiều", "Tối"].map((shift, index) => (
            <CTableRow key={index}>
              <CTableDataCell className="bg-warning text-center fw-bold">
                {shift}
              </CTableDataCell>
              {Object.keys(schedule).map((day, idx) => (
                <CTableDataCell key={idx}>
                  {schedule[day][shift].length > 0 ? (
                    <ul className="mb-0 ps-3">
                      {schedule[day][shift].map((row, i) => (
                        <li key={i}>
                          {row.name}
                          {row.ghi_chu && (
                            <span className="text-danger ms-1">
                              ({row.ghi_chu})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </CTableDataCell>
              ))}
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </div>
  );
};

export default XemLichLamViec;
