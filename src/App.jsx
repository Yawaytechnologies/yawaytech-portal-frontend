import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedLayout from "./components/common/ProtectedLayout";
import AddExpensePage from "./pages/AddExpensePage.jsx";
import { useSelector } from "react-redux";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import Employees from "./Pages/EmployeePage.jsx";
import HRDetail from "./components/EmployeeOverview/HrOverview.jsx";



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

          {/* Employee Views */}
        <Route path="employees/hr" element={<Employees role="hr" />} />
        <Route path="employees/developer" element={<Employees role="softwaredeveloper" />} />
        <Route path="employees/creator" element={<Employees role="digitalcreator" />} />
          {/* Employee Overview */}
          <Route path="employees/hr/:employeeId" element={<HRDetail />} />
          

        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={user ? "/add-expense" : "/signin"} />} />
      </Routes>
    </Router>
  );
};

export default App;
