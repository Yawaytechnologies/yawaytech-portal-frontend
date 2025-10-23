import React from "react";
import HREmployees from "../components/employee/HREmployees";
import SoftwareDeveloper from "../components/employee/SoftwareDeveloper";
import DigitalCreator from "../components/employee/DigitalCreator";

const Employees = ({ role }) => {
  return (
    <>
      {role === "hr" && <HREmployees />}
      {role === "softwaredeveloper" && <SoftwareDeveloper />}
      {role === "digitalcreator" && <DigitalCreator />}
    </>
  );
};

export default Employees;
