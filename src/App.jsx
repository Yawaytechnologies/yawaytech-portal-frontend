// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/common/ProtectedLayout";
// import Dashboard from "./components/dashboard/Dashboard";
// import AddExpense from "./components/expenses/AddExpense";
// import ExpenseList from "./components/expenses/ExpenseList";
// import Reports from "./components/expenses/Reports";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Layout applied globally */}
        <Route path="/" element={<ProtectedLayout />}>
          {/* 👇 All routes inside the layout */}
          {/* <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-expense" element={<AddExpense />} />
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="reports" element={<Reports />} /> */}

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
