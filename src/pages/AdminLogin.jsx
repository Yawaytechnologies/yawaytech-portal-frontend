import React, { useEffect, useState, useCallback } from "react";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin } from "../redux/actions/authActions";
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

const STYLE_SUCCESS = { ...PILL, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" };
const STYLE_ERROR   = { ...PILL, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" };
const STYLE_WARN    = { ...PILL, background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" };

const LOGIN_TOAST_ID = "login-success-pill";

// ✅ Allow Admin ID to be either 6 OR 9 chars (A–Z & 0–9) with at least one letter & one digit
const adminIdRegex = /^(?=.*[A-Z])(?=.*\d)(?:[A-Z0-9]{6}|[A-Z0-9]{9})$/;

export default function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth || {});
  const isValidId = adminIdRegex.test(adminId);

  // Keep maxLength 9 — users can enter 6 or 9
  const cleanId = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);

  const toastSuccess = useCallback(
    (msg) => toast(msg, { ...TOAST_BASE, style: STYLE_SUCCESS, icon: false, toastId: LOGIN_TOAST_ID }),
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
      return toastWarn("Admin ID must be 6 or 9 chars (A–Z & 0–9) with at least one letter and one digit.");
    if (!password) return toastWarn("Password is required.");

    setIsSubmitting(true);
    toast.dismiss(LOGIN_TOAST_ID);

    dispatch(loginAdmin({ adminId, password }))
      .unwrap()
      .then(() => {
        if (!toast.isActive(LOGIN_TOAST_ID)) {
          toastSuccess("Signed in successfully. Redirecting…");
        }
        setTimeout(() => navigate("/dashboard"), 600);
      })
      .catch((err) => {
        toastError(err?.message || "Invalid credentials. Please try again.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366]">
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

      {/* Add pt-14 to reserve space under the top-right switcher */}
      <div className="w-[95vw] max-w-sm rounded-2xl bg-white/90 shadow-xl backdrop-blur p-6 pt-14 relative">
        {/* 🔝 Role switcher pinned top-right */}
        <RoleSwitcher current="Admin" placement="absolute" />

        <div className="text-center mb-3">
          <img src={logo} alt="logo" className="h-16 mx-auto" />
          <h3 className="font-bold text-blue-900">Yaway Tech Portal</h3>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3 items-center">
          {/* Admin ID */}
          <div className="w-64">
            <label className="block text-xs font-semibold text-blue-900 mb-1">Admin ID</label>
            <div className="relative">
              <input
                className={`h-8 w-full px-2 text-xs rounded-md border ${
                  touched ? (isValidId ? "border-green-400" : "border-red-400") : "border-blue-200"
                } bg-blue-50 outline-none focus:border-2 focus:border-blue-500 text-blue-900`}
                value={adminId}
                onChange={(e) => setAdminId(cleanId(e.target.value))}
                onBlur={() => setTouched(true)}
                onFocus={() => setTouched(true)}
                onKeyDown={(e) => {
                  const ok =
                    /^[a-zA-Z0-9]$/.test(e.key) ||
                    ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "Delete"].includes(e.key);
                  if (!ok) e.preventDefault();
                }}
                maxLength={9}
                placeholder="Enter Admin ID"
                autoComplete="username"
              />
              {touched && adminId.length > 0 && (
                isValidId ? (
                  <FiCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg" />
                ) : (
                  <FiXCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-lg" />
                )
              )}
            </div>
          </div>

          {/* Password */}
          <div className="w-64">
            <label className="block text-xs font-semibold text-blue-900 mb-1">Password</label>
            <div className="relative">
              <input
                className="h-8 w-full px-2 text-xs rounded-md border border-blue-200 bg-blue-50 outline-none focus:border-2 focus:border-blue-500 text-blue-900"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-700"
                onMouseDown={() => setShowPwd(true)}
                onMouseUp={() => setShowPwd(false)}
                onMouseLeave={() => setShowPwd(false)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="mt-1 w-40 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 disabled:opacity-60"
          >
            {loading || isSubmitting ? "Signing In..." : "Sign In as Admin"}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
