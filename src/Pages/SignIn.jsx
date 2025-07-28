import React, { useState } from "react";
import { FiCheckCircle, FiXCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const emailOrEmpIdRegex =
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9]{4,20})$/;

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const isEmailValid = emailOrEmpIdRegex.test(email);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366]">
      <div className="relative w-[95vw] max-w-sm rounded-2xl overflow-hidden shadow-xl bg-white/90 backdrop-blur-md">
        {/* SVG Backgrounds */}
        <svg className="absolute -top-14 -left-14 w-32 h-32 z-0" viewBox="0 0 300 300" fill="none">
          <ellipse cx="150" cy="150" rx="90" ry="60" fill="#38bdf8" fillOpacity="0.13" />
          <ellipse cx="200" cy="80" rx="44" ry="30" fill="#6366f1" fillOpacity="0.10" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-20 h-12 z-0" viewBox="0 0 200 100" fill="none">
          <ellipse cx="150" cy="100" rx="45" ry="17" fill="#a5b4fc" fillOpacity="0.15" />
        </svg>
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 384 480" fill="none" style={{ opacity: 0.12 }}>
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#smallGrid)" />
        </svg>

        {/* Card Content */}
        <div className="relative z-10 px-3 pt-3 pb-3 flex flex-col">
          <div className="flex flex-col items-center justify-center mb-2">
            <img src={logo} alt="Yaway Tech Logo" className="h-20 w-25 object-contain" draggable="false" />
            <h3 className="text-sm font-bold text-blue-900 mb-0.5 tracking-wide sm:text-base">
              Yaway Tech Portal
            </h3>
            <h3 className="text-xs font-semibold text-blue-900 sm:text-sm">Sign In</h3>
          </div>

          <div className="flex flex-col gap-2 items-center">
            {/* Email/EmpID Field */}
            <div className="w-full flex flex-col items-center">
              <label htmlFor="email" className="block text-xs font-semibold text-blue-900 mb-0.5 text-left w-64">
                Email or Phone No
              </label>
              <div className="relative w-64">
                <input
                  id="email"
                  type="text"
                  placeholder="Enter email or emp ID"
                  className={`peer h-7 px-2 text-xs rounded-md border ${
                    emailTouched
                      ? isEmailValid
                        ? "border-green-400"
                        : "border-red-400"
                      : "border-blue-200"
                  } bg-blue-50 outline-none focus:border-2 focus:border-blue-500 transition w-full`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  onFocus={() => setEmailTouched(true)}
                  autoComplete="username"
                  onKeyDown={(e) => {
                    // Block special chars except valid email or emp ID pattern
                    const isValidKey = /^[a-zA-Z0-9@._+-]$/.test(e.key) || e.key === "Backspace" || e.key === "Tab";
                    if (!isValidKey) e.preventDefault();
                  }}
                />
                {emailTouched && email.length > 0 && (
                  isEmailValid ? (
                    <FiCheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg pointer-events-none" />
                  ) : (
                    <FiXCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-lg pointer-events-none" />
                  )
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="w-full flex flex-col items-center">
              <label htmlFor="password" className="block text-xs font-semibold text-blue-900 mb-0.5 text-left w-64">
                Password
              </label>
              <div className="relative w-64">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter password"
                  className="peer h-7 px-2 text-xs rounded-md border border-blue-200 bg-blue-50 outline-none focus:border-2 focus:border-blue-500 transition w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-700 text-base bg-transparent outline-none"
                  style={{ padding: 0, border: "none" }}
                  onPointerDown={() => setShowPwd(true)}
                  onPointerUp={() => setShowPwd(false)}
                  onPointerLeave={() => setShowPwd(false)}
                  onBlur={() => setShowPwd(false)}
                >
                  {showPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="button"
              className="mt-2 w-30 mx-auto rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 py-1.5 text-center text-xs font-semibold uppercase text-white shadow-md hover:shadow-lg transition"
            >
              Sign In
            </button>

            {/* Redirect to Sign Up */}
            <p className="mt-2 text-center text-xs text-gray-600">
              Don&apos;t have an account?
              <Link to="/signup" className="ml-1 font-bold text-blue-900 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
