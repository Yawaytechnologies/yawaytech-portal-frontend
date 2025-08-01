import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/common/ProtectedLayout";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AddExpensePage from "./components/expenses/AddExpense";
import { useSelector } from "react-redux";

const App = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={user ? <ProtectedLayout /> : <Navigate to="/signin" replace />}
        >
          <Route index element={<Navigate to="/add-expense" />} />
          <Route path="add-expense" element={<AddExpensePage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={user ? "/add-expense" : "/signin"} />} />
      </Routes>
    </Router>
  );
};

export default App;
