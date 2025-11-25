import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LeaveLayout from "../components/Leave/LeaveLayout";
import ApplyLeave from "../components/Leave/ApplyLeave";
import MyRequests from "../components/Leave/MyRequests";
import Approvals from "../components/Leave/Approvals";
import PolicyManager from "../components/Leave/PolicyManager";
import BalanceAdjust from "../components/Leave/BalanceAdjust";

export default function LeaveManagement() {
  return (
    <Routes>
      <Route element={<LeaveLayout />}>
        <Route path="apply" element={<ApplyLeave />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="policies" element={<PolicyManager />} />
        <Route path="balances" element={<BalanceAdjust />} />
        <Route index element={<Navigate to="apply" replace />} />
      </Route>
    </Routes>
  );
}
