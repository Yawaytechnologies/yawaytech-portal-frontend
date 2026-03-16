// src/component/NewEmployee/NewEmployeeForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createEmployee,
  PROFILE_FIELD_NAME,
} from "../../redux/actions/newEmployeeAction";
import { updateEmployeeById } from "../../redux/services/newEmployeeService";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { FaSave, FaUpload } from "react-icons/fa";

function normalizeYMD(value) {
  const raw = String(value ?? "").trim();
  const safe = raw.replace(/[^\d-]/g, "");
  const [yRaw = "", mRaw = "", dRaw = ""] = safe.split("-");
  const y = yRaw.slice(0, 4);

  let m = mRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (m.length === 2) {
    let mm = Number(m);
    if (Number.isNaN(mm)) mm = 1;
    if (mm < 1) mm = 1;
    if (mm > 12) mm = 12;
    m = String(mm).padStart(2, "0");
  }

  let d = dRaw.replace(/[^\d]/g, "").slice(0, 2);
  if (d.length === 2) {
    let dd = Number(d);
    if (Number.isNaN(dd)) dd = 1;
    if (dd < 1) dd = 1;
    if (dd > 30) dd = 30;
    d = String(dd).padStart(2, "0");
  }

  let out = y;
  if (safe.includes("-") || m.length) out += "-" + m;
  if ((safe.match(/-/g) || []).length >= 2 || d.length) out += "-" + d;
  return out.slice(0, 10);
}

function parseYMDDate(s) {
  if (!s || typeof s !== "string") return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function addYears(date, years) {
  const x = new Date(date);
  x.setFullYear(x.getFullYear() + years);
  return x;
}

const DEPARTMENTS = ["HR", "IT", "SALES", "FINANCE", "MARKETING"];
const MARITAL = ["Single", "Married"];

const MAX_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_RE = /^[0-9]{12}$/;

// ✅ CHANGE: Permanent Address PIN rule (6 digits)
const PIN6_RE = /\b\d{6}\b/;

export default function NewEmployeeForm({
  onCancel,
  onCreated,
  accent = "#4F46E5",
  initialData = null, // ✅ when editing
}) {
  const dispatch = useDispatch();
  const { creating, createError } = useSelector((s) => s.newEmployees);

  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const isEdit = !!initialData?.employee_id;

  const [form, setForm] = useState({
    name: "",
    father_name: "",
    employee_id: "",
    date_of_birth: "",
    date_of_joining: "",
    date_of_leaving: "",
    email: "",
    mobile_number: "",
    marital_status: "Single",
    permanent_address: "",
    designation: "",
    department: "IT",
    pan_number: "",
    aadhar_number: "",
    password: "",
    [PROFILE_FIELD_NAME]: null,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // ✅ load initialData into form
  useEffect(() => {
    if (!initialData) return;

    setForm((f) => ({
      ...f,
      name: initialData.name ?? "",
      father_name: initialData.father_name ?? "",
      employee_id: initialData.employee_id ?? "",
      date_of_birth: (initialData.date_of_birth ?? "").slice(0, 10),
      date_of_joining: (initialData.date_of_joining ?? "").slice(0, 10),
      date_of_leaving: (initialData.date_of_leaving ?? "").slice(0, 10),
      email: initialData.email ?? "",
      mobile_number: initialData.mobile_number ?? "",
      marital_status: initialData.marital_status ?? "Single",
      permanent_address: initialData.permanent_address ?? "",
      designation: initialData.designation ?? "",
      department: (initialData.department ?? "IT").toUpperCase(),
      pan_number: (initialData.pan_number ?? "").toUpperCase(),
      aadhar_number: initialData.aadhar_number ?? "",
      password: "", // don’t prefill
      [PROFILE_FIELD_NAME]: null, // optional in edit
    }));
    setErrors({});
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // ✅ profile photo validations (same as AddEmployee.jsx)
    if (name === PROFILE_FIELD_NAME) {
      const file = files?.[0] || null;

      if (!file) {
        setForm((f) => ({ ...f, [PROFILE_FIELD_NAME]: null }));
        // ✅ CHANGE: clear preview if user removed file
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrors((p) => ({
          ...p,
          [PROFILE_FIELD_NAME]: "Only JPG/PNG/WEBP allowed",
        }));
        setForm((f) => ({ ...f, [PROFILE_FIELD_NAME]: null }));
        // ✅ CHANGE: clear preview on invalid file
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        return;
      }

      if (file.size > MAX_MB * 1024 * 1024) {
        setErrors((p) => ({
          ...p,
          [PROFILE_FIELD_NAME]: `Max ${MAX_MB}MB allowed`,
        }));
        setForm((f) => ({ ...f, [PROFILE_FIELD_NAME]: null }));
        // ✅ CHANGE: clear preview on oversize file
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        return;
      }

      setErrors((p) => ({ ...p, [PROFILE_FIELD_NAME]: "" }));

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      setForm((f) => ({ ...f, [PROFILE_FIELD_NAME]: file }));
      return;
    }

    if (name === "mobile_number") {
      let m = value.replace(/\D/g, "").slice(0, 10);
      if (m.length > 0 && !/^[6-9]/.test(m)) m = "";
      setForm((f) => ({ ...f, mobile_number: m }));
      return;
    }

    if (
      name === "date_of_birth" ||
      name === "date_of_joining" ||
      name === "date_of_leaving"
    ) {
      const v = normalizeYMD(value);
      setForm((prev) => ({ ...prev, [name]: v }));
      return;
    }

    if (name === "pan_number") {
      const pan = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
      setForm((f) => ({ ...f, pan_number: pan }));
      return;
    }

    if (name === "aadhar_number") {
      const aad = value.replace(/\D/g, "").slice(0, 12);
      setForm((f) => ({ ...f, aadhar_number: aad }));
      return;
    }

    if (name === "department") {
      setForm((f) => ({ ...f, department: value.toUpperCase() }));
      return;
    }

    if (name === "name" || name === "father_name") {
      const cleaned = value
        .replace(/[^A-Za-z\s]/g, "")
        .replace(/\s+/g, " ")
        .trimStart();
      setForm((f) => ({ ...f, [name]: cleaned }));
      return;
    }

    // ✅ CHANGE: employee_id sanitize (9 chars, alnum, uppercase) — matches your "exact 9 chars" rule
    if (name === "employee_id") {
      const cleaned = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 9);
      setForm((f) => ({ ...f, employee_id: cleaned }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    const req = (k, label = k) => {
      if (!String(form[k] || "").trim()) e[k] = `${label} is required`;
    };

    req("name", "Name");
    // ✅ CHANGE: Name must be at least 2 characters (same as AddEmployee.jsx)
    if (form.name && form.name.trim().length > 0 && form.name.trim().length < 2) {
      e.name = "Name must be at least 2 characters";
    }

    req("father_name", "Father Name");
    // ✅ CHANGE: Father Name must be at least 2 characters (same as AddEmployee.jsx)
    if (
      form.father_name &&
      form.father_name.trim().length > 0 &&
      form.father_name.trim().length < 2
    ) {
      e.father_name = "Father Name must be at least 2 characters";
    }

    req("employee_id", "Employee ID");
    req("date_of_birth", "Date of Birth");
    req("date_of_joining", "Date of Joining");
    req("email", "Email");
    req("mobile_number", "Mobile Number");
    req("marital_status", "Marital Status");
    req("permanent_address", "Permanent Address");
    req("designation", "Designation");
    req("department", "Department");
    req("pan_number", "PAN Number");
    req("aadhar_number", "Aadhar Number");

    // password only required on create
    if (!isEdit) req("password", "Password");

    // ✅ CHANGE: Password min 8 (create required, edit optional)
    if (form.password && form.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }

    if (form.employee_id && form.employee_id.length !== 9) {
      e.employee_id = "Employee ID must be exactly 9 characters";
    }

    if (form.mobile_number) {
      if (form.mobile_number.length !== 10)
        e.mobile_number = "Mobile number must be 10 digits";
      else if (!/^[6-9]/.test(form.mobile_number))
        e.mobile_number = "Mobile must start with 6, 7, 8, or 9";
    }

    const dob = parseYMDDate(form.date_of_birth);
    const doj = parseYMDDate(form.date_of_joining);

    if (form.date_of_birth && !dob) e.date_of_birth = "Enter valid DOB";
    if (form.date_of_joining && !doj) e.date_of_joining = "Enter valid DOJ";

    if (dob) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dob > today) e.date_of_birth = "DOB cannot be in the future";
    }

    if (dob && doj) {
      if (doj < dob)
        e.date_of_joining = "Joining date cannot be before birth date";
      const minDoj = addYears(dob, 18);
      if (doj < minDoj)
        e.date_of_joining =
          "Employee must be at least 18 years old on Date of Joining";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (doj > today)
        e.date_of_joining = "Joining date cannot be in the future";
    }

    if (form.date_of_leaving && form.date_of_joining) {
      const dol = parseYMDDate(form.date_of_leaving);
      if (doj && dol && dol < doj)
        e.date_of_leaving = "Leaving date cannot be before joining date";
    }

    // ✅ CHANGE: Permanent Address must contain 6-digit PIN (same intent as your comment)
    if (form.permanent_address && !PIN6_RE.test(form.permanent_address)) {
      e.permanent_address = "Permanent Address must include 6-digit PIN";
    }

    // PAN stricter validation
    if (form.pan_number && !PAN_RE.test(form.pan_number.toUpperCase()))
      e.pan_number = "Invalid PAN (format: AAAAA9999A)";

    // Aadhaar 12 digits
    if (form.aadhar_number && !AADHAAR_RE.test(form.aadhar_number))
      e.aadhar_number = "Aadhar must be 12 digits";

    // photo required only on create
    if (!isEdit && !form[PROFILE_FIELD_NAME]) {
      e[PROFILE_FIELD_NAME] = "Profile photo is required";
    }

    setErrors(e);
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) return;

    try {
      if (!isEdit) {
        await dispatch(createEmployee({ ...form })).unwrap();
      } else {
        const payload = {
          name: form.name,
          father_name: form.father_name,
          employee_id: form.employee_id,
          date_of_birth: form.date_of_birth,
          date_of_joining: form.date_of_joining,
          date_of_leaving: form.date_of_leaving || null,
          email: form.email,
          mobile_number: form.mobile_number,
          marital_status: form.marital_status,
          permanent_address: form.permanent_address,
          designation: form.designation,
          department: form.department,
          pan_number: form.pan_number,
          aadhar_number: form.aadhar_number,
          ...(form.password ? { password: form.password } : {}),
        };

        await updateEmployeeById(form.employee_id, payload, token);
      }

      onCreated?.();
    } catch {
      // create errors in redux, update errors are thrown
    }
  };

  const btnLabel =
    creating === "pending" ? "Saving..." : isEdit ? "Update" : "Save";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {createError && !isEdit ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {createError}
        </div>
      ) : null}

      {/* Photo */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Profile Photo {isEdit ? "(optional)" : ""}
        </h3>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 cursor-pointer hover:bg-gray-50 shadow-sm hover:shadow">
            <FaUpload />
            <span>Upload Photo</span>
            <input
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              name={PROFILE_FIELD_NAME}
              onChange={handleChange}
            />
          </label>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
              No image
            </div>
          )}
        </div>

        {errors[PROFILE_FIELD_NAME] && (
          <p className="mt-1 text-xs text-red-600">
            {errors[PROFILE_FIELD_NAME]}
          </p>
        )}
      </section>

      {/* Basic */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
          <Field
            label="Father Name"
            name="father_name"
            value={form.father_name}
            onChange={handleChange}
            error={errors.father_name}
          />
          <Field
            label="Employee ID (9 chars)"
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            error={errors.employee_id}
            maxLength={9}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Field
            label="Mobile Number"
            name="mobile_number"
            value={form.mobile_number}
            onChange={handleChange}
            error={errors.mobile_number}
            maxLength={10}
          />

          <Field
            label="PAN"
            name="pan_number"
            value={form.pan_number}
            onChange={handleChange}
            error={errors.pan_number}
            maxLength={10}
          />
          <Field
            label="Aadhar"
            name="aadhar_number"
            value={form.aadhar_number}
            onChange={handleChange}
            error={errors.aadhar_number}
            maxLength={12}
          />

          <Select
            label="Marital Status"
            name="marital_status"
            value={form.marital_status}
            onChange={handleChange}
            options={MARITAL}
            error={errors.marital_status}
          />
        </div>
      </section>

      {/* Job */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Job & Department
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Designation"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            error={errors.designation}
          />
          <Select
            label="Department"
            name="department"
            value={form.department}
            onChange={handleChange}
            options={DEPARTMENTS}
            error={errors.department}
          />
          <Field
            label="Permanent Address"
            name="permanent_address"
            value={form.permanent_address}
            onChange={handleChange}
            error={errors.permanent_address}
            className="md:col-span-2"
          />
        </div>
      </section>

      {/* Dates */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            error={errors.date_of_birth}
          />
          <Field
            label="Date of Joining"
            name="date_of_joining"
            type="date"
            value={form.date_of_joining}
            onChange={handleChange}
            error={errors.date_of_joining}
          />
          <Field
            label="Date of Leaving (optional)"
            name="date_of_leaving"
            type="date"
            value={form.date_of_leaving}
            onChange={handleChange}
            error={errors.date_of_leaving}
          />
        </div>
      </section>

      {/* Password */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {isEdit ? "Password (optional change)" : "Account"}
        </h3>
        <PasswordField
          label="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder={
            isEdit ? "Leave empty to keep same password" : "Min 8 characters"
          }
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={creating === "pending"}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white font-medium shadow hover:opacity-90 active:translate-y-[1px] disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          <FaSave className="text-sm" />
          {btnLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- inputs ---------- */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  error,
  placeholder,
  className = "",
  ...rest
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition bg-white text-gray-900 shadow-sm hover:shadow
          ${error ? "border-red-300" : "border-gray-300"}`}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Select({ label, name, value, onChange, options = [], error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition bg-white text-gray-900 shadow-sm hover:shadow
          ${error ? "border-red-300" : "border-gray-300"}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  showPassword,
  setShowPassword,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {label}
      </label>
      <div
        className={`w-full rounded-lg border flex items-center px-3 py-2 bg-white shadow-sm hover:shadow ${
          error ? "border-red-300" : "border-gray-300"
        }`}
      >
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent text-gray-900"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="ml-2 rounded p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          {showPassword ? <IoEyeOff /> : <IoEye />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}