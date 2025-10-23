// src/redux/actions/newEmployeeAction.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createEmployeeForm } from "../services/newEmployeeService";

// Must match your FastAPI UploadFile param name shown in Swagger
export const PROFILE_FIELD_NAME = "profile_picture";

// yyyy-mm-dd normalization (accepts Date or string)
function toYMD(v) {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d)) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function buildFormData(p) {
  const fd = new FormData();
  fd.append("name", p.name ?? "");
  fd.append("father_name", p.father_name ?? "");
  fd.append("employee_id", p.employee_id ?? "");
  fd.append("date_of_birth", toYMD(p.date_of_birth));
  fd.append("date_of_joining", toYMD(p.date_of_joining));
  fd.append("email", p.email ?? "");
  fd.append("mobile_number", p.mobile_number ?? "");
  fd.append("marital_status", p.marital_status ?? "");
  fd.append("permanent_address", p.permanent_address ?? "");
  fd.append("designation", p.designation ?? "");
  fd.append("department", p.department ?? "");
  fd.append("password", p.password ?? "");
  if (p.date_of_leaving) fd.append("date_of_leaving", toYMD(p.date_of_leaving));

  const file = p[PROFILE_FIELD_NAME];
  if (file instanceof File || file instanceof Blob) {
    fd.append(PROFILE_FIELD_NAME, file, file.name ?? "upload.bin");
  }
  return fd;
}

export const createEmployee = createAsyncThunk(
  "newEmployees/create",
  async (formObject, { getState, rejectWithValue }) => {
    try {
      const token =
        getState()?.auth?.token || localStorage.getItem("token") || undefined;

      const fd = buildFormData(formObject);
      const data = await createEmployeeForm(fd, token);
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to create employee");
    }
  }
);
