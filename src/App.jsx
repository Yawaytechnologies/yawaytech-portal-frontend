import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedLayout from "./components/common/ProtectedLayout";
import SignIn from "./Pages/SignIn.jsx";
import SignUp from "./Pages/SignUp.jsx";
import DashboardPage from "./Pages/DashboardPage.jsx";
import AddExpensePage from "./Pages/AddExpensePage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes (after login) */}
        <Route path="/" element={<ProtectedLayout />}>
          {/* Dashboard shows by default and also on /dashboard */}
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {/* Add Expense Page */}
          <Route path="add-expense" element={<AddExpensePage />} />
        </Route>

        {/* Catch-all: Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
