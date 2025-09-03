import React, { useState } from "react";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginEmployee } from "../redux/actions/authActions";
import logo from "../assets/logo.png";

// Exactly 9 chars, UPPERCASE letters+digits, must contain at least one letter and one digit
const employeeIdRegex = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{9}$/;

export default function EmployeeLogin() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth || {});

  const cleanId = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
  const isValidId = employeeIdRegex.test(employeeId);

  const submit = (e) => {
    e.preventDefault();
    if (!isValidId || !password) return;
    dispatch(loginEmployee({ employeeId, password }))
      .unwrap()
      .then(() => navigate("/dashboard"))
      .catch(() => {});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366]">
      <div className="w-[95vw] max-w-sm rounded-2xl bg-white/90 shadow-xl backdrop-blur p-6 relative">
        <div className="text-center mb-3">
          <img src={logo} alt="logo" className="h-16 mx-auto" />
          <h3 className="font-bold text-blue-900">Yaway Tech Portal</h3>
        </div>

        {/* Mirrors Admin spacing/alignment */}
        <form onSubmit={submit} className="flex flex-col gap-3 items-center">
          {/* Employee ID */}
          <div className="w-64">
            <label className="block text-xs font-semibold text-blue-900 mb-1">Employee ID</label>
            <div className="relative">
              <input
                className={`h-8 w-full px-2 text-xs rounded-md border ${
                  touched ? (isValidId ? "border-green-400" : "border-red-400") : "border-blue-200"
                } bg-blue-50 outline-none focus:border-2 focus:border-blue-500 text-blue-900`}
                value={employeeId}
                onChange={(e) => setEmployeeId(cleanId(e.target.value))}
                onBlur={() => setTouched(true)}
                onFocus={() => setTouched(true)}
                onKeyDown={(e) => {
                  const ok =
                    /^[a-zA-Z0-9]$/.test(e.key) ||
                    ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "Delete"].includes(e.key);
                  if (!ok) e.preventDefault();
                }}
                maxLength={9}
                placeholder="Enter Employee ID"
                autoComplete="username"
              />
              {touched && employeeId.length > 0 && (
                isValidId ? (
                  <FiCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg" />
                ) : (
                  <FiXCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-lg" />
                )
              )}
            </div>
          </div>

          {/* Password (any chars allowed) */}
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
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Primary button (unchanged label per your last request) */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-40 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2"
          >
            {loading ? "Signing In..." : "Sign In as Employeee"}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <p className="text-xs text-gray-600">
            Are you an admin?
            <Link to="/admin-login" className="ml-1 font-bold text-blue-900">Click here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
