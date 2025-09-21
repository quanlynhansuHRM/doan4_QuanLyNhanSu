import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from "@coreui/react";

const XemLichCaNhan = () => {
  const [schedule, setSchedule] = useState(null);
  const { maNhanVien } = useParams();

  useEffect(() => {
    if (!maNhanVien) {
      console.warn("Không tìm thấy mã nhân viên trong URL.");
      return;
    }

    axios
      .get(`http://localhost:5010/xemlichlamvieccanhan/${maNhanVien}`)
      .then((response) => {
        const rawData = response.data;

        const formattedSchedule = {
          "Thứ 2": { Sáng: null, Chiều: null, Tối: null },
          "Thứ 3": { Sáng: null, Chiều: null, Tối: null },
          "Thứ 4": { Sáng: null, Chiều: null, Tối: null },
          "Thứ 5": { Sáng: null, Chiều: null, Tối: null },
          "Thứ 6": { Sáng: null, Chiều: null, Tối: null },
          "Thứ 7": { Sáng: null, Chiều: null, Tối: null },
          "Chủ nhật": { Sáng: null, Chiều: null, Tối: null },
        };

        rawData.forEach(({ ho, ten, day_of_week, shift, ghi_chu }) => {
          if (
            formattedSchedule[day_of_week] &&
            formattedSchedule[day_of_week][shift] !== undefined
          ) {
            formattedSchedule[day_of_week][shift] = {
              ten: [ho, ten].filter(Boolean).join(" "),
              ghi_chu: ghi_chu || "",
            };
          }
        });

        setSchedule(formattedSchedule);
      })
      .catch((error) => console.error("Lỗi tải lịch cá nhân:", error));
  }, [maNhanVien]);

  if (!maNhanVien)
    return <p className="text-danger">Không tìm thấy thông tin đăng nhập.</p>;
  if (!schedule)
    return <p className="text-info">Đang tải lịch làm việc cá nhân...</p>;

  return (
    <div>
      <h4 className="mb-3">Lịch làm việc cá nhân</h4>
      <CTable bordered responsive>
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
              <CTableDataCell className="bg-warning text-center">
                {shift}
              </CTableDataCell>
              {Object.keys(schedule).map((day, idx) => (
                <CTableDataCell key={idx} className="text-center">
                  {schedule[day][shift] ? (
                    <>
                      {schedule[day][shift].ten}
                      {schedule[day][shift].ghi_chu?.includes("Xin nghỉ") && (
                        <span className="text-danger ms-1">(Xin nghỉ)</span>
                      )}
                    </>
                  ) : (
                    "—"
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

export default XemLichCaNhan;
