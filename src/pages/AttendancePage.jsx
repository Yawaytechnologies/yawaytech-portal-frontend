import React from "react";
import HREmployees from "../components/Attendance/HREmployees";
import SoftwareDeveloper from "../components/Attendance/SoftwareDeveloper";
import DigitalCreator from "../components/Attendance/DigitalCreator";

const Attendance = ({ role }) => {
  return (
    <>
      {role === "hr" && <HREmployees />}
      {role === "softwaredeveloper" && <SoftwareDeveloper />}
      {role === "digitalcreator" && <DigitalCreator />}
    </>
  );
};

export default Attendance;
