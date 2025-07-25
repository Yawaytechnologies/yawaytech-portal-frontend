import React, { useState } from "react";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"; // Adjust as needed

const SignUp = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);

  // Form state for icon validation
  const [firstName, setFirstName] = useState("");
  const [firstTouched, setFirstTouched] = useState(false);

  const [lastName, setLastName] = useState("");
  const [lastTouched, setLastTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  // Simple validators
  const isFirstValid = firstName.trim().length > 1;
  const isLastValid = lastName.trim().length > 1;
  const emailRegex = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const isEmailValid = emailRegex.test(email);

  // - Align labels to input: remove mx-auto, use only w-full, reduce form width for compactness.
  // - Input width: w-full; Container: w-[88%] mx-auto (for label & input together)
  // - Icon: right-3 top-1/2 -translate-y-1/2 text-lg (inside input)
  const labelClass =
    "block w-full text-left text-[15px] font-medium text-blue-900 mb-[2px] mt-2";
  const inputClass =
    "w-full h-8 px-2 text-sm rounded-md bg-blue-50 outline-none focus:ring-2 focus:ring-blue-400 transition block border-0 shadow-none pr-8"; // pr-8 for icon

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366]">
      <div className="relative w-[95vw] max-w-[380px] rounded-2xl overflow-hidden shadow-xl bg-white/90 backdrop-blur-md">
        {/* SVG Decorative Backgrounds */}
        <svg
          className="absolute -top-14 -left-14 w-32 h-32 z-0"
          viewBox="0 0 300 300"
          fill="none"
        >
          <ellipse cx="150" cy="150" rx="90" ry="60" fill="#38bdf8" fillOpacity="0.13" />
          <ellipse cx="200" cy="80" rx="44" ry="30" fill="#6366f1" fillOpacity="0.10" />
        </svg>
        <svg
          className="absolute bottom-0 right-0 w-20 h-12 z-0"
          viewBox="0 0 200 100"
          fill="none"
        >
          <ellipse cx="150" cy="100" rx="45" ry="17" fill="#a5b4fc" fillOpacity="0.15" />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          viewBox="0 0 384 480"
          fill="none"
          style={{ opacity: 0.12 }}
        >
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#smallGrid)" />
        </svg>

        {/* Card Content */}
        <div className="relative z-10 px-4 pt-2 pb-2 flex flex-col">
          <div className="flex flex-col items-center justify-center mb-1">
            <img
              src={logo}
              alt="Yawaytech Logo"
              className="h-15 w-25 object-contain mb-0.5"
              draggable="false"
            />
            <h3 className="text-lg font-bold text-blue-900 mb-0.5 tracking-wide text-center">
              Yawaytech Portal
            </h3>
            <h3 className="text-base font-semibold text-blue-900 text-center">
              Sign Up
            </h3>
          </div>
          <form className="flex flex-col gap-0">
            {/* First Name */}
            <div className="w-[88%] mx-auto">
              <label htmlFor="firstname" className={labelClass}>
                First Name
              </label>
              <div className="relative">
                <input
                  id="firstname"
                  type="text"
                  placeholder="First name"
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setFirstTouched(true)}
                  onFocus={() => setFirstTouched(true)}
                />
                {firstTouched && firstName.length > 0 && (
                  isFirstValid ? (
                    <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg pointer-events-none" />
                  ) : (
                    <FiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg pointer-events-none" />
                  )
                )}
              </div>
            </div>

            {/* Last Name */}
            <div className="w-[88%] mx-auto">
              <label htmlFor="lastname" className={labelClass}>
                Last Name
              </label>
              <div className="relative">
                <input
                  id="lastname"
                  type="text"
                  placeholder="Last name"
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setLastTouched(true)}
                  onFocus={() => setLastTouched(true)}
                />
                {lastTouched && lastName.length > 0 && (
                  isLastValid ? (
                    <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg pointer-events-none" />
                  ) : (
                    <FiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg pointer-events-none" />
                  )
                )}
              </div>
            </div>

            {/* Email */}
            <div className="w-[88%] mx-auto">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  onFocus={() => setEmailTouched(true)}
                />
                {emailTouched && email.length > 0 && (
                  isEmailValid ? (
                    <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg pointer-events-none" />
                  ) : (
                    <FiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg pointer-events-none" />
                  )
                )}
              </div>
            </div>

            {/* Create Password */}
            <div className="w-[88%] mx-auto">
              <label htmlFor="password" className={labelClass}>
                Create Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Create password"
                  className={inputClass + " pr-8"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700 text-lg bg-transparent outline-none"
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

            {/* Confirm Password */}
            <div className="w-[88%] mx-auto">
              <label htmlFor="oldpassword" className={labelClass}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="oldpassword"
                  type={showOldPwd ? "text" : "password"}
                  placeholder="Confirm password"
                  className={inputClass + " pr-8"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700 text-lg bg-transparent outline-none"
                  style={{ padding: 0, border: "none" }}
                  onPointerDown={() => setShowOldPwd(true)}
                  onPointerUp={() => setShowOldPwd(false)}
                  onPointerLeave={() => setShowOldPwd(false)}
                  onBlur={() => setShowOldPwd(false)}
                >
                  {showOldPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="button"
              className="mt-3 w-[40%] mx-auto rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 py-1.5 text-center text-xs font-semibold uppercase text-white shadow-md hover:shadow-lg transition"
            >
              SIGN UP
            </button>
            <p className="mt-2 text-center text-sm text-gray-600">
              Don't have an account?
              <Link
                to="/signin"
                className="ml-1 font-bold text-blue-900 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
