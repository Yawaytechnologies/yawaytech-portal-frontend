// src/component/NewEmployee/AddEmployee.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createEmployee, PROFILE_FIELD_NAME } from "../../redux/actions/newEmployeeAction";
import { useNavigate, useLocation } from "react-router-dom";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { FaSave, FaUpload } from "react-icons/fa";

const DEPARTMENTS = ["HR", "IT", "SALES", "FINANCE", "MARKETING"];
const MARITAL = ["Single", "Married"];

const MAX_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewEmployee() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { creating, createError, lastCreated } = useSelector((s) => s.newEmployees);

  // Topbar title on hard reloads
  useEffect(() => {
    if (!location.state?.title) {
      window.history.replaceState(
        { ...(location.state || {}), title: "New Employee" },
        ""
      );
    }
  }, [location]);

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
    password: "",
    [PROFILE_FIELD_NAME]: null, // file
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === PROFILE_FIELD_NAME) {
      const file = files && files[0];
      if (!file) {
        setForm((f) => ({ ...f, [PROFILE_FIELD_NAME]: null }));
        setPreviewUrl("");
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrors((er) => ({ ...er, [PROFILE_FIELD_NAME]: "Only JPG, PNG or WEBP allowed" }));
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setErrors((er) => ({ ...er, [PROFILE_FIELD_NAME]: `File must be ≤ ${MAX_MB} MB` }));
        return;
      }
      setErrors((er) => ({ ...er, [PROFILE_FIELD_NAME]: null }));
      setForm((f) => ({ ...f, [PROFILE_FIELD_NAME]: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      return;
    }

    if (name === "employee_id") {
      setForm((f) => ({ ...f, employee_id: value.toUpperCase().slice(0, 9) }));
      return;
    }
    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((f) => ({ ...f, mobile_number: digits }));
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
    req("father_name", "Father Name");
    req("employee_id", "Employee ID");
    req("date_of_birth", "Date of Birth");
    req("date_of_joining", "Date of Joining");
    req("email", "Email");
    req("mobile_number", "Mobile Number");
    req("marital_status", "Marital Status");
    req("permanent_address", "Permanent Address");
    req("designation", "Designation");
    req("department", "Department");
    req("password", "Password");

    if (form.employee_id && form.employee_id.length !== 9) {
      e.employee_id = "Employee ID must be exactly 9 characters";
    }
    if (form.mobile_number && form.mobile_number.length !== 10) {
      e.mobile_number = "Mobile number must be 10 digits";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email";
    }
    if (form.password && form.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }
    if (form.date_of_leaving && form.date_of_joining) {
      const doj = new Date(form.date_of_joining);
      const dol = new Date(form.date_of_leaving);
      if (dol < doj) e.date_of_leaving = "Leaving date cannot be before joining date";
    }

    // recommended: require a photo
    if (!form[PROFILE_FIELD_NAME]) {
      e[PROFILE_FIELD_NAME] = "Profile photo is required";
    }

    setErrors(e);
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) return;

    const payload = { ...form };
    try {
      await dispatch(createEmployee(payload)).unwrap();

      // clear form
      setForm({
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
        password: "",
        [PROFILE_FIELD_NAME]: null,
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");

      // navigate if you want:
      // navigate("/employees/hr", { state: { title: "HR Profiles" } });
    } catch {
      // errors surfaced via redux state
    }
  };

  const creatingLabel = creating === "pending" ? "Saving..." : "Save Employee";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-black/5 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">New Employee</h2>
          <p className="text-sm text-gray-500">Fill in the details and upload a profile photo.</p>
        </div>

        {createError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {createError}
          </div>
        )}
        {creating === "succeeded" && lastCreated && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Employee created successfully.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Photo */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile Photo</h3>
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
              <p className="mt-1 text-xs text-red-600">{errors[PROFILE_FIELD_NAME]}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">JPG/PNG/WEBP, up to {MAX_MB} MB.</p>
          </section>

          {/* Basic info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
              <Field label="Father Name" name="father_name" value={form.father_name} onChange={handleChange} error={errors.father_name} />
              <Field
                label="Employee ID (9 chars)"
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                error={errors.employee_id}
                maxLength={9}
                placeholder="e.g., EMP102367"
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="name@company.com"
              />
              <Field
                label="Mobile Number (10 digits)"
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
                error={errors.mobile_number}
                inputMode="numeric"
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

          {/* Job info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Job & Department</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                error={errors.designation}
                placeholder="e.g., Software Developer"
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
                placeholder="Street, Area, City, State, PIN"
                className="md:col-span-2"
              />
            </div>
          </section>

          {/* Dates */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Min 8 characters"
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={creating === "pending"}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF5800] px-4 py-2 text-white font-medium shadow hover:opacity-90 active:translate-y-[1px] disabled:opacity-60"
            >
              <FaSave className="text-sm" />
              {creatingLabel}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- small inputs ---------------- */

function Field({ label, name, value, onChange, type = "text", error, placeholder, className = "", ...rest }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition
          bg-white text-gray-900 placeholder-gray-400 caret-[#FF5800]
          focus:ring-2 focus:ring-[#FF5800]/25 focus:border-[#FF5800]
          shadow-sm hover:shadow
          ${error ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-gray-300"}`}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Select({ label, name, value, onChange, options = [], error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition
          bg-white text-gray-900 caret-[#FF5800]
          focus:ring-2 focus:ring-[#FF5800]/25 focus:border-[#FF5800]
          shadow-sm hover:shadow
          ${error ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-gray-300"}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, placeholder, error, showPassword, setShowPassword }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      <div
        className={`w-full rounded-lg border flex items-center px-3 py-2 transition
        bg-white ${error ? "border-red-300" : "border-gray-300"}
        focus-within:ring-2 focus-within:ring-[#FF5800]/25 focus-within:border-[#FF5800]
        shadow-sm hover:shadow`}
      >
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400 caret-[#FF5800]"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="ml-2 rounded p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <IoEyeOff /> : <IoEye />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
