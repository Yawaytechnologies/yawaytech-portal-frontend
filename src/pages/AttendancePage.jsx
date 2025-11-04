import React from "react";
import HREmployees from "../components/Attendance/HREmployees";
import SoftwareDeveloper from "../components/Attendance/SoftwareDeveloper";


const Attendance = ({ role }) => {
  return (
    <>
      {role === "hr" && <HREmployees />}
      {role === "softwaredeveloper" && <SoftwareDeveloper />}
      
    </>
  );
};

export default Attendance;
