import React from "react";
import HREmployees from "../components/employee/HREmployees";
import SoftwareDeveloper from "../components/employee/SoftwareDeveloper";
import DigitalCreator from "../components/employee/DigitalCreator";
import MarketingEmployees from "../components/employee/Marketing.jsx";
import FinanceEmployees from "../components/employee/Finance.jsx";
import SalesEmployees from "../components/employee/Sales.jsx";

const Employees = ({ role }) => {
  return (
    <>
      {role === "hr" && <HREmployees />}
      {role === "softwaredeveloper" && <SoftwareDeveloper />}
      {role === "digitalcreator" && <DigitalCreator />}
      {role === "marketing" && <MarketingEmployees />}
      {role === "finance" && <FinanceEmployees />}
      {role === "sales" && <SalesEmployees />}
      
    </>
  );
};

export default Employees;
