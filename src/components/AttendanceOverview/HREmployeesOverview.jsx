import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdEventAvailable, MdEventBusy, MdAccessTime } from "react-icons/md";
import { fetchEmployeeByIdAPI } from "../../redux/services/hrOverviewService";

import { fetchAttendanceByMonth, setAttendanceMonth, clearAttendance } from "../../redux/actions/hrAttendanceActions";

export default function HrEmployeeOverview() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, month, rows, present, absent, totalHours } = useSelector((s) => s.attendance);

  const [emp, setEmp] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(true);

  // default month
  useEffect(() => {
    if (!month) {
      const dt = new Date();
      const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      dispatch(setAttendanceMonth(m));
    }
  }, [dispatch, month]);

  // fetch attendance when employee/month changes
// fetch when month or employeeId changes
useEffect(() => {
  if (employeeId && month) {
    dispatch(fetchAttendanceByMonth(employeeId, month));
  }
}, [dispatch, employeeId, month]);

// clear only on unmount
useEffect(() => {
  return () => {
    dispatch(clearAttendance());
  };
}, [dispatch]);



  // load employee basics
  useEffect(() => {
    (async () => {
      try { setEmp(await fetchEmployeeByIdAPI(employeeId)); }
      finally { setLoadingEmp(false); }
    })();
  }, [employeeId]);

  if (loadingEmp) return <div className="p-6">Loading employee…</div>;
  if (!emp) return <div className="p-6 text-red-600">Employee not found</div>;

  return (
    <div className="p-6 min-h-screen bg-[#f4f6fa]">
      <button onClick={() => navigate(-1)} className="text-[#FF5800] underline mb-4">← Back</button>

      <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-2xl font-bold text-[#0e1b34]">Employee Attendance</h2>
          <input
            type="month"
            value={month || ""}
            onChange={(e) => dispatch(setAttendanceMonth(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Profile */}
        <div className="px-6 pb-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <img src={emp.profile} alt={emp.name}
                   className="w-14 h-14 rounded-full object-cover border-2 border-[#FF5800]" />
              <div>
                <div className="text-lg font-semibold text-[#0e1b34]">{emp.name}</div>
                <div className="text-xs text-gray-600">Employee ID - {emp.employeeId}</div>
                <div className="text-xs text-gray-600">{emp.jobTitle || emp.designation || emp.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={<MdEventAvailable />} label="Present" value={present}
                       bg="bg-green-50" text="text-green-700" />
          <SummaryCard icon={<MdEventBusy />} label="Absent" value={absent}
                       bg="bg-rose-50" text="text-rose-700" />
          <SummaryCard icon={<MdAccessTime />} label="Total Hours" value={totalHours}
                       bg="bg-blue-50" text="text-blue-700" />
        </div>

        {/* History */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-[#0e1b34] mb-3">Attendance History</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Date</Th><Th>Check In</Th><Th>Check Out</Th><Th>Hours</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><Td colSpan={5} className="text-center py-6">Loading…</Td></tr>
                ) : error ? (
                  <tr><Td colSpan={5} className="text-center py-6 text-red-600">{error}</Td></tr>
                ) : rows.length === 0 ? (
                  <tr><Td colSpan={5} className="text-center py-6">No records</Td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.date} className="border-t">
                      <Td>{r.date}</Td>
                      <Td>{r.timeIn || "—"}</Td>
                      <Td>{r.timeOut || "—"}</Td>
                      <Td>{r.hours}</Td>
                      <Td>
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.label === "Present" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                        }`}>{r.label}</span>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* small UI helpers */
function SummaryCard({ icon, label, value, bg, text }) {
  return (
    <div className={`rounded-xl border border-gray-200 ${bg} p-4 flex items-center gap-3`}>
      <div className={`${text} text-xl`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-600">{label}</div>
        <div className="text-lg font-semibold text-[#0e1b34]">{value}</div>
      </div>
    </div>
  );
}
function Th({ children }) { return <th className="px-4 py-3 text-left font-medium">{children}</th>; }
function Td({ children, colSpan, className = "" }) {
  return (
    <td
      className={`px-4 py-2 align-middle text-[#0e1b34] ${className}`}
      colSpan={colSpan}
    >
      {children || "—"}
    </td>
  );
}

