import React, { useState } from "react";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../redux/actions/authActions";
import logo from "../assets/logo.png"; // Update path as needed

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const [showPwd, setShowPwd] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [firstTouched, setFirstTouched] = useState(false);

  const [lastName, setLastName] = useState("");
  const [lastTouched, setLastTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isFirstValid = firstName.trim().length > 1;
  const isLastValid = lastName.trim().length >= 1; // ✅ Updated here
  const emailRegex = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const isEmailValid = emailRegex.test(email);
  const phoneRegex = /^[6-9]\d{9}$/;
  const isPhoneValid = phoneRegex.test(phone);

  const labelClass =
    "block w-full text-left text-[14px] font-medium text-blue-900 mb-[2px] mt-1";
  const inputClass =
    "w-full h-7 px-2 text-sm rounded-md bg-blue-50 outline-none focus:ring-2 focus:ring-blue-400 transition block border-0 shadow-none pr-8 text-blue-900";

  const handleSignup = () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      alert("Please fill in all the required fields.");
      return;
    }

    if (!isFirstValid || !isEmailValid || !isPhoneValid) {
      alert("Please fill in valid details.");
      return;
    }

    if (phone.length !== 10) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const strongPwdRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,}$/;
    if (!strongPwdRegex.test(password)) {
      alert(
        "Password must be at least 6 characters long and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    const newUser = {
      firstName,
      lastName,
      email,
      phone,
      password,
    };

    dispatch(signupUser(newUser)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        navigate("/signin", { state: { prefillEmail: email } });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0e1b34] via-[#18234b] to-[#223366]">
      <div className="relative w-[95vw] max-w-sm rounded-2xl overflow-hidden shadow-xl bg-white/90 backdrop-blur-md">
        <svg
          className="absolute -top-14 -left-14 w-32 h-32 z-0"
          viewBox="0 0 300 300"
          fill="none"
        >
          <ellipse
            cx="150"
            cy="150"
            rx="90"
            ry="60"
            fill="#38bdf8"
            fillOpacity="0.13"
          />
          <ellipse
            cx="200"
            cy="80"
            rx="44"
            ry="30"
            fill="#6366f1"
            fillOpacity="0.10"
          />
        </svg>
        <svg
          className="absolute bottom-0 right-0 w-20 h-12 z-0"
          viewBox="0 0 200 100"
          fill="none"
        >
          <ellipse
            cx="150"
            cy="100"
            rx="45"
            ry="17"
            fill="#a5b4fc"
            fillOpacity="0.15"
          />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          viewBox="0 0 384 480"
          fill="none"
          style={{ opacity: 0.12 }}
        >
          <defs>
            <pattern
              id="smallGrid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#smallGrid)" />
        </svg>

        <div className="relative z-10 px-3 pt-2 pb-3 flex flex-col">
          <div className="flex flex-col items-center justify-center mb-2">
            <img
              src={logo}
              alt="Yaway Tech Logo"
              className="h-16 w-auto object-contain"
              draggable="false"
            />
            <h3 className="text-base font-bold text-blue-900 tracking-wide text-center">
              Yaway Tech Portal
            </h3>
          </div>

          <form className="flex flex-col gap-0">
            {[ 
              {
                id: "firstname",
                label: "First Name",
                type: "text",
                value: firstName,
                onChange: setFirstName,
                onBlur: () => setFirstTouched(true),
                onFocus: () => setFirstTouched(true),
                isValid: isFirstValid,
                touched: firstTouched,
              },
              {
                id: "lastname",
                label: "Last Name",
                type: "text",
                value: lastName,
                onChange: setLastName,
                onBlur: () => setLastTouched(true),
                onFocus: () => setLastTouched(true),
                isValid: isLastValid,
                touched: lastTouched,
              },
              {
                id: "email",
                label: "Email",
                type: "email",
                value: email,
                onChange: setEmail,
                onBlur: () => setEmailTouched(true),
                onFocus: () => setEmailTouched(true),
                isValid: isEmailValid,
                touched: emailTouched,
              },
              {
                id: "phone",
                label: "Phone Number",
                type: "text",
                value: phone,
                onChange: setPhone,
                onBlur: () => setPhoneTouched(true),
                onFocus: () => setPhoneTouched(true),
                isValid: isPhoneValid,
                touched: phoneTouched,
              },
            ].map((input) => (
              <div className="w-full max-w-xs mx-auto" key={input.id}>
                <label htmlFor={input.id} className={labelClass}>
                  {input.label}
                </label>
                <div className="relative">
                  <input
                    id={input.id}
                    type={input.type}
                    placeholder={input.label}
                    className={inputClass}
                    value={input.value}
                    onChange={(e) => input.onChange(e.target.value)}
                    onBlur={input.onBlur}
                    onFocus={input.onFocus}
                    onKeyDown={
                      input.id.includes("name")
                        ? (e) => {
                            if (!/^[a-zA-Z\b\s]*$/.test(e.key))
                              e.preventDefault();
                          }
                        : input.id === "phone"
                        ? (e) => {
                            if (!/^\d$/.test(e.key) && e.key !== "Backspace")
                              e.preventDefault();
                          }
                        : undefined
                    }
                  />
                  {input.touched && input.value.length > 0 && (
                    input.isValid ? (
                      <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg" />
                    ) : (
                      <FiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg" />
                    )
                  )}
                </div>
              </div>
            ))}

            {/* Create Password */}
            <div className="w-full max-w-xs mx-auto">
              <label htmlFor="password" className={labelClass}>
                Create Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Create password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700 text-lg bg-transparent outline-none"
                  onPointerDown={() => setShowPwd(true)}
                  onPointerUp={() => setShowPwd(false)}
                  onPointerLeave={() => setShowPwd(false)}
                >
                  {showPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="w-full max-w-xs mx-auto">
              <label htmlFor="oldpassword" className={labelClass}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="oldpassword"
                  type={showOldPwd ? "text" : "password"}
                  placeholder="Confirm password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700 text-lg bg-transparent outline-none"
                  onPointerDown={() => setShowOldPwd(true)}
                  onPointerUp={() => setShowOldPwd(false)}
                  onPointerLeave={() => setShowOldPwd(false)}
                >
                  {showOldPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="mt-3 w-full max-w-[140px] mx-auto rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 py-1.5 text-center text-xs font-semibold uppercase text-white shadow-md hover:shadow-lg transition"
            >
              {loading ? "Signing Up..." : "SIGN UP"}
            </button>

            {error && (
              <p className="text-red-500 text-xs text-center mt-1">{error}</p>
            )}

            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?
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
