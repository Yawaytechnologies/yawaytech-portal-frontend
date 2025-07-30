// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/common/ProtectedLayout";
import SignIn from "./Pages/SignIn.jsx";
import SignUp from "./Pages/SignUp.jsx";
// import Dashboard from "./components/dashboard/Dashboard";
import AddExpensePage from "./components/expenses/AddExpense";
// import ExpenseList from "./components/expenses/ExpenseList";
// import Reports from "./components/expenses/Reports";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Layout applied globally */}
        <Route path="/" element={<ProtectedLayout />}>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/add-expense" element={<AddExpensePage />} />
          
          {/* <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="reports" element={<Reports />} />

          {/* Default redirect to dashboard */}
          <Route index element={<Navigate to="/" replace />} />
        </Route>

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
