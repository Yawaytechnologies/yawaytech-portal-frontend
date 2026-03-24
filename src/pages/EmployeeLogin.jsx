import React, { useEffect, useState, useCallback } from "react";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginEmployee } from "../redux/actions/authActions";
import logo from "../assets/logo.png";
import RoleSwitcher from ".././pages/RoleSwitcher.jsx";

/* 🔔 Toastify */
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 1200,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "auto",
  maxWidth: "min(72vw, 260px)",
  padding: "5px 9px",
  lineHeight: 1.2,
  minHeight: 0,
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
  fontSize: "0.80rem",
  fontWeight: 600,
};

const STYLE_SUCCESS = {
  ...PILL,
  background: "#ECFDF5",
  color: "#065F46",
  border: "1px solid #A7F3D0",
};
const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};
const STYLE_WARN = {
  ...PILL,
  background: "#FFFBEB",
  color: "#92400E",
  border: "1px solid #FDE68A",
};

const EMP_LOGIN_TOAST_ID = "employee-login-success-pill";

// ✅ Allow 6 OR 9 chars, A–Z/0–9, at least one letter & one digit
const employeeIdRegex = /^(?=.*[A-Z])(?=.*\d)(?:[A-Z0-9]{6}|[A-Z0-9]{9})$/;

export default function EmployeeLogin() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth || {});

  const cleanId = (val) =>
    val
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 9);
  const isValidId = employeeIdRegex.test(employeeId);

  const toastSuccess = useCallback(
    (msg) =>
      toast(msg, {
        ...TOAST_BASE,
        style: STYLE_SUCCESS,
        icon: false,
        toastId: EMP_LOGIN_TOAST_ID,
      }),
    []
  );
  const toastError = useCallback(
    (msg) => toast(msg, { ...TOAST_BASE, style: STYLE_ERROR, icon: false }),
    []
  );
  const toastWarn = useCallback(
    (msg) => toast(msg, { ...TOAST_BASE, style: STYLE_WARN, icon: false }),
    []
  );

  useEffect(() => {
    if (error) toastError(String(error));
  }, [error, toastError]);

  const submit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isValidId)
      return toastWarn(
        "Employee ID must be 6 or 9 chars (A–Z & 0–9) with at least one letter and one digit."
      );
    if (!password) return toastWarn("Password is required.");

    setIsSubmitting(true);
    toast.dismiss(EMP_LOGIN_TOAST_ID);

    dispatch(loginEmployee({ employeeId: cleanId(employeeId), password }))
      .unwrap()
      .then(() => {
        if (!toast.isActive(EMP_LOGIN_TOAST_ID)) {
          toastSuccess("Signed in successfully. Redirecting…");
        }
        setTimeout(() => navigate("/dashboard"), 600); // change to "/employee/dashboard" if that's your route
      })
      .catch((err) => {
        toastError(err?.message || "Invalid credentials. Please try again.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0e1b34] to-[#1a2d5a] p-4">
      <ToastContainer
        position="top-center"
        transition={Slide}
        limit={1}
        closeButton={false}
        newestOnTop
        style={{ top: 8 }}
        toastClassName={() => "m-0 p-0 bg-transparent shadow-none"}
        bodyClassName={() => "m-0 p-0"}
      />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Orange accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#FF5800] via-[#ff8c42] to-[#FF5800]" />

          <div className="px-8 py-8">
            {/* Header row: logo+title left, role switcher right */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <img src={logo} alt="logo" className="h-10 mb-3" />
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Welcome back</h1>
                <p className="text-sm text-slate-500 mt-1">Sign in to your Employee Portal</p>
              </div>
              <div className="mt-1">
                <RoleSwitcher current="Employee" placement="relative" />
              </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Employee ID
                </label>
                <div className="relative">
                  <input
                    className={`h-11 w-full px-3 pr-10 text-sm rounded-xl border-2 outline-none transition-all
                      ${touched
                        ? isValidId
                          ? "border-emerald-400 bg-emerald-50/40 focus:border-emerald-500"
                          : "border-red-400 bg-red-50/30 focus:border-red-500"
                        : "border-slate-200 bg-slate-50 focus:border-[#FF5800] focus:bg-white"
                      } text-slate-900 placeholder:text-slate-400`}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(cleanId(e.target.value))}
                    onBlur={() => setTouched(true)}
                    onFocus={() => setTouched(true)}
                    onKeyDown={(e) => {
                      const ok =
                        /^[a-zA-Z0-9]$/.test(e.key) ||
                        ["Backspace","Tab","ArrowLeft","ArrowRight","Home","End","Delete"].includes(e.key);
                      if (!ok) e.preventDefault();
                    }}
                    maxLength={9}
                    placeholder="e.g. EMP001 or EMP001234"
                    autoComplete="username"
                  />
                  {touched && employeeId.length > 0 && (
                    isValidId
                      ? <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-lg" />
                      : <FiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg" />
                  )}
                </div>
                {touched && employeeId && !isValidId && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Must be <strong>6 or 9</strong> characters (A–Z &amp; 0–9), with at least one letter and one digit.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="h-11 w-full px-3 pr-12 text-sm rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-[#FF5800] focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-0 top-0 h-full px-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="mt-1 h-11 w-full rounded-xl bg-[#FF5800] hover:bg-[#d94d00] active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-lg shadow-[#FF5800]/30"
              >
                {loading || isSubmitting ? "Signing in…" : "Sign in as Employee"}
              </button>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          © {new Date().getFullYear()} Yaway Technologies
        </p>
      </div>
    </div>
  );
}
