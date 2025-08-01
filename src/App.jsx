import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedLayout from "./components/common/ProtectedLayout";
import AddExpensePage from "./components/expenses/AddExpense";
import { useSelector } from "react-redux";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";


const App = () => {
  const { user } = useSelector((state) => state.auth);

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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={user ? "/add-expense" : "/signin"} />} />
      </Routes>
    </Router>
  );
};

export default App;
