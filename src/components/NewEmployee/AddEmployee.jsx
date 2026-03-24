// src/component/NewEmployee/AddEmployee.jsx
import React, { useEffect, useMemo, useState } from "react";
import NewEmployeeForm from "./NewEmployeeForm";
import {
  deleteEmployeeById,
  listEmployeesApi,
} from "../../redux/services/newEmployeeService";

const ACCENT = "#4F46E5";

function Card({ title, right, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="font-extrabold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="p-5 text-slate-900">{children}</div>
    </div>
  );
}

export default function AddEmployee() {
  const [openForm, setOpenForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listEmployeesApi(token);
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setRows(list);
    } catch (e) {
      setErr(e?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreatedOrUpdated = () => {
    setOpenForm(false);
    setEditingRow(null);
    load();
  };

  const onDelete = async (row) => {
    const id = row?.employee_id;
    if (!id) return;

    const ok = window.confirm(`Delete employee ${id}?`);
    if (!ok) return;

    try {
      await deleteEmployeeById(id, token);
      load();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xl font-extrabold text-slate-900">Employees</div>
        </div>

        <button
          onClick={() => {
            setEditingRow(null);
            setOpenForm(false);
            setTimeout(() => setOpenForm(true), 0);
          }}
          className="rounded-xl px-4 py-2 text-white font-semibold shadow-lg active:translate-y-[1px]"
          style={{ backgroundColor: ACCENT }}
        >
          New Employee
        </button>
      </div>

      {/* Create / Edit Form */}
      {(openForm || editingRow) && (
        <div className="mb-5">
          <Card
            title={
              editingRow
                ? `Edit Employee (${editingRow.employee_id})`
                : "New Employee"
            }
            right={
              <button
                onClick={() => {
                  setOpenForm(false);
                  setEditingRow(null);
                }}
                className="text-sm rounded-lg border px-3 py-1 hover:bg-slate-50"
              >
                Close
              </button>
            }
          >
            <NewEmployeeForm
              onCancel={() => {
                setOpenForm(false);
                setEditingRow(null);
              }}
              onCreated={onCreatedOrUpdated}
              accent={ACCENT}
              initialData={editingRow ?? null} // ← ensures null when creating
            />
          </Card>
        </div>
      )}

      {/* Table */}
      <Card
        title="Employee List"
        right={
          <button
            onClick={load}
            className="text-sm rounded-lg border px-3 py-1 hover:bg-slate-50"
          >
            Refresh
          </button>
        }
      >
        {err ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Employee ID</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Mobile</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Designation</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-slate-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id || r.employee_id}>
                    <td className="px-4 py-3">{r.name || "-"}</td>
                    <td className="px-4 py-3">{r.employee_id || "-"}</td>
                    <td className="px-4 py-3">{r.email || "-"}</td>
                    <td className="px-4 py-3">{r.mobile_number || "-"}</td>
                    <td className="px-4 py-3">{r.department || "-"}</td>
                    <td className="px-4 py-3">{r.designation || "-"}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setOpenForm(false);
                            setEditingRow(r);
                          }}
                          className="text-xs rounded-lg px-3 py-1 border border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => onDelete(r)}
                          className="text-xs rounded-lg px-3 py-1 bg-red-600 text-white hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
