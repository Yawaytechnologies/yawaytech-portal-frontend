// src/pages/LoginPage.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

const handleLogin = () => {
  
  localStorage.setItem("token", "dummy-auth-token");
  localStorage.setItem("user", email);
  localStorage.setItem("role", "admin"); // or "user"
  navigate("/dashboard");
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
