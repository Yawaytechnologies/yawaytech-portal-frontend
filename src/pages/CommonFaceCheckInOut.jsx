// src/pages/CommonFaceCheckInOut.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BsFillCameraFill } from "react-icons/bs";
import { MdError } from "react-icons/md";
import { FiX } from "react-icons/fi";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/$/, "");

const PASSCODE = import.meta.env.VITE_KIOSK_PASSCODE || "Admin@123";

const DEPARTMENTS = ["HR", "IT", "Marketing", "Finance", "Sales"];

// Keep all because backend field name is not stable.
// FastAPI ignores extra form fields usually.
const FACE_SCAN_FIELDS = ["file", "selfie", "image"];

const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const STORAGE_KEY = `yaway-face-attendance-${todayKey()}`;

const formatTime = (dateValue) => {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatDuration = (startValue, endValue = new Date()) => {
  if (!startValue) return "00:00:00";

  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  const diff = Math.max(0, end - start);

  const totalSeconds = Math.floor(diff / 1000);
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");

  return `${hrs}:${mins}:${secs}`;
};

const readAttendanceStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeAttendanceStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const getErrorMessage = async (res) => {
  const data = await res.json().catch(() => ({}));
  console.log("API ERROR RESPONSE:", data);

  if (typeof data?.detail === "string") return data.detail;

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => {
        const loc = Array.isArray(item?.loc) ? item.loc.join(".") : "";
        return `${loc} ${item?.msg || ""}`.trim();
      })
      .join(", ");
  }

  if (data?.message) return data.message;

  return `Failed (${res.status})`;
};

const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camError, setCamError] = useState(null);

  const startCamera = useCallback(async () => {
    setCamError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCamError(err?.message || "Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureBlob = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return null;
    if (!video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }, []);

  return {
    videoRef,
    canvasRef,
    camError,
    startCamera,
    stopCamera,
    captureBlob,
  };
};

async function postFaceApi(url, imageBlob) {
  const form = new FormData();

  FACE_SCAN_FIELDS.forEach((fieldName) => {
    form.append(fieldName, imageBlob, "face.jpg");
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(await getErrorMessage(res));
    }

    return await res.json().catch(() => ({}));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiCheckIn(employeeId, imageBlob) {
  const id = encodeURIComponent(employeeId);

  return postFaceApi(
    `${BASE_URL}/api/check-in-with-face?employeeId=${id}&employee_id=${id}`,
    imageBlob,
  );
}

async function apiCheckOut(employeeId, imageBlob) {
  const id = encodeURIComponent(employeeId);

  return postFaceApi(
    `${BASE_URL}/api/check-out-with-face?employeeId=${id}&employee_id=${id}`,
    imageBlob,
  );
}

async function apiFetchEmployees(dept) {
  const res = await fetch(
    `${BASE_URL}/api/department/${encodeURIComponent(dept)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");

  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === "success" ? "#10b981" : "#ef4444"};
    color: white;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    z-index: 9999;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    max-width: 90vw;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function YawayHeader() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={S.header}>
      <div style={S.headerContent} className="header-content">
        <div style={S.logo}>
          <div style={S.logoBox}>Y</div>
          <span style={S.logoText}>YAWAY PORTAL</span>
        </div>

        <div style={S.headerTitle}>
          <h1 style={S.title}>Face Attendance</h1>
          <p style={S.subtitle}>Check-In / Check-Out</p>
        </div>

        <div style={S.timeDisplay} className="header-time">
          <div style={S.time}>
            {now.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>

          <div style={S.date}>
            {now.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function CommonFaceCheckInOut() {
  const [authed, setAuthed] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const [selectedDept, setSelectedDept] = useState("");
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);

  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedEmpName, setSelectedEmpName] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [timerNow, setTimerNow] = useState(new Date());

  const cam = useCamera();
  const { startCamera, stopCamera, captureBlob } = cam;
  const streamStartedRef = useRef(false);

  const isCheckedIn = attendanceRecord?.status === "CHECKED_IN";
  const isCheckedOut = attendanceRecord?.status === "CHECKED_OUT";

  const runningDuration = useMemo(() => {
    if (!attendanceRecord?.checkInAt) return "00:00:00";

    if (attendanceRecord?.checkOutAt) {
      return formatDuration(
        attendanceRecord.checkInAt,
        attendanceRecord.checkOutAt,
      );
    }

    return formatDuration(attendanceRecord.checkInAt, timerNow);
  }, [attendanceRecord, timerNow]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (cameraActive && !streamStartedRef.current) {
      streamStartedRef.current = true;
      startCamera();
    }

    if (!cameraActive) {
      streamStartedRef.current = false;
      stopCamera();
    }
  }, [cameraActive, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const loadEmployeeAttendance = (employeeId) => {
    if (!employeeId) {
      setAttendanceRecord(null);
      return null;
    }

    const store = readAttendanceStore();
    const record = store[employeeId] || null;

    setAttendanceRecord(record);
    return record;
  };

  const saveEmployeeAttendance = (employeeId, record) => {
    const store = readAttendanceStore();
    store[employeeId] = record;
    writeAttendanceStore(store);
    setAttendanceRecord(record);
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();

    if (passcodeInput === PASSCODE) {
      setAuthed(true);
      setPasscodeInput("");
      setPasscodeError("");
      return;
    }

    setPasscodeError("Incorrect passcode");
    setPasscodeInput("");
  };

  const handleDeptChange = async (e) => {
    const dept = e.target.value;

    setSelectedDept(dept);
    setSelectedEmpId("");
    setSelectedEmpName("");
    setEmployees([]);
    setLastResult(null);
    setAttendanceRecord(null);
    setCameraActive(false);
    stopCamera();

    if (!dept) return;

    setEmpLoading(true);

    try {
      const list = await apiFetchEmployees(dept);

      const normalized = Array.isArray(list)
        ? list.map((emp) => ({
            id: emp.employee_id || emp.employeeId || emp.id || "",
            name:
              emp.name ||
              emp.employee_name ||
              emp.full_name ||
              emp.fullName ||
              "Unknown",
          }))
        : [];

      setEmployees(normalized.filter((emp) => emp.id));
    } catch (err) {
      showToast(err.message || "Failed to load employees", "error");
      setEmployees([]);
    } finally {
      setEmpLoading(false);
    }
  };

  const handleEmpChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find((item) => item.id === empId);

    setSelectedEmpId(empId);
    setSelectedEmpName(emp?.name || "");
    setLastResult(null);

    const record = loadEmployeeAttendance(empId);

    if (record?.status === "CHECKED_IN") {
      setLastResult({
        success: false,
        message: `Already checked in at ${formatTime(record.checkInAt)}`,
      });
    }

    if (record?.status === "CHECKED_OUT") {
      setLastResult({
        success: true,
        message: `Today completed. Duration ${formatDuration(
          record.checkInAt,
          record.checkOutAt,
        )}`,
      });
    }

    stopCamera();
    streamStartedRef.current = false;
    setCameraActive(false);

    if (empId) {
      setTimeout(() => {
        setCameraActive(true);
      }, 100);
    }
  };

  const getCapturedFace = async () => {
    const blob = await captureBlob();

    if (!blob) {
      throw new Error("Image capture failed. Please try again.");
    }

    return blob;
  };

  const handleCheckIn = async () => {
    if (!selectedEmpId) return;

    const existingRecord = loadEmployeeAttendance(selectedEmpId);

    if (existingRecord?.status === "CHECKED_IN") {
      setLastResult({
        success: false,
        message: `Already checked in at ${formatTime(existingRecord.checkInAt)}`,
      });
      showToast("Already checked in today", "error");
      return;
    }

    if (existingRecord?.status === "CHECKED_OUT") {
      setLastResult({
        success: false,
        message: "Today already completed. Check-in again is not allowed.",
      });
      showToast("Today already completed", "error");
      return;
    }

    setScanning(true);

    try {
      const blob = await getCapturedFace();
      const response = await apiCheckIn(selectedEmpId, blob);

      const record = {
        employeeId: selectedEmpId,
        employeeName: selectedEmpName,
        date: todayKey(),
        status: "CHECKED_IN",
        checkInAt: new Date().toISOString(),
        checkOutAt: null,
        duration: null,
        checkInResponse: response,
      };

      saveEmployeeAttendance(selectedEmpId, record);

      setLastResult({
        success: true,
        message: `Check-in successful at ${formatTime(record.checkInAt)}`,
      });

      showToast(`${selectedEmpName} checked in successfully`);
    } catch (err) {
      setLastResult({
        success: false,
        message: err.message || "Check-in failed",
      });
      showToast(err.message || "Check-in failed", "error");
    } finally {
      setScanning(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmpId) return;

    const existingRecord = loadEmployeeAttendance(selectedEmpId);

    if (!existingRecord) {
      setLastResult({
        success: false,
        message: "Check-in not found. Please check in first.",
      });
      showToast("Please check in first", "error");
      return;
    }

    if (existingRecord.status === "CHECKED_OUT") {
      setLastResult({
        success: false,
        message: `Already checked out at ${formatTime(existingRecord.checkOutAt)}`,
      });
      showToast("Already checked out today", "error");
      return;
    }

    setScanning(true);

    try {
      const blob = await getCapturedFace();
      const response = await apiCheckOut(selectedEmpId, blob);

      const checkOutAt = new Date().toISOString();

      const updatedRecord = {
        ...existingRecord,
        status: "CHECKED_OUT",
        checkOutAt,
        duration: formatDuration(existingRecord.checkInAt, checkOutAt),
        checkOutResponse: response,
      };

      saveEmployeeAttendance(selectedEmpId, updatedRecord);

      setLastResult({
        success: true,
        message: `Check-out successful. Duration ${updatedRecord.duration}`,
      });

      showToast(`${selectedEmpName} checked out successfully`);
    } catch (err) {
      setLastResult({
        success: false,
        message: err.message || "Check-out failed",
      });
      showToast(err.message || "Check-out failed", "error");
    } finally {
      setScanning(false);
    }
  };

  if (!authed) {
    return (
      <div style={S.passcodePageWrapper}>
        <div style={S.passcodeContainer}>
          <div style={S.passcodeCard}>
            <div style={S.passcodeHeader}>
              <div style={S.lockIcon}>🔐</div>
              <div style={S.passcodeTitle}>Secure Access</div>
              <p style={S.passcodeSubTitle}>Enter passcode to access kiosk</p>
            </div>

            <form onSubmit={handlePasscodeSubmit} style={S.passcodeForm}>
              <div>
                <label style={S.label}>Passcode</label>

                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    setPasscodeError("");
                  }}
                  placeholder="••••••••"
                  autoFocus
                  style={{
                    ...S.input,
                    borderColor: passcodeError ? "#ef4444" : "#e5e7eb",
                    background: passcodeError ? "#fef2f2" : "#f9fafb",
                  }}
                />

                {passcodeError && (
                  <div style={S.passcodeError}>
                    <FiX size={16} /> {passcodeError}
                  </div>
                )}
              </div>

              <button type="submit" style={S.btnPasscodeSubmit}>
                Access Kiosk
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.mainPageWrapper}>
      <style>{`
        .kiosk-camera-wrap {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          width: 100%;
          aspect-ratio: 4 / 3;
        }

        .kiosk-camera-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scaleX(-1);
        }

        @media (max-width: 768px) {
          .kiosk-grid {
            grid-template-columns: 1fr !important;
          }

          .kiosk-left {
            order: 2;
          }

          .kiosk-right {
            order: 1;
            min-height: auto !important;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 14px !important;
          }

          .header-time {
            align-items: center !important;
          }

          .button-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .kiosk-camera-wrap {
            aspect-ratio: 3 / 2;
          }
        }
      `}</style>

      <YawayHeader />

      <main style={S.mainContent}>
        <div className="kiosk-grid" style={S.container}>
          <div className="kiosk-left" style={S.leftPanel}>
            <div style={S.formGroup}>
              <label style={S.label}>Department</label>

              <select
                value={selectedDept}
                onChange={handleDeptChange}
                style={S.select}
              >
                <option value="">-- Select Department --</option>

                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {selectedDept && (
              <div style={S.formGroup}>
                <label style={S.label}>Employee</label>

                {empLoading ? (
                  <div style={S.loadingState}>Loading employees...</div>
                ) : (
                  <select
                    value={selectedEmpId}
                    onChange={handleEmpChange}
                    style={S.select}
                  >
                    <option value="">-- Select Employee --</option>

                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {selectedEmpName && (
              <div style={S.employeeCard}>
                <div style={S.employeeLabel}>Selected Employee</div>
                <div style={S.employeeName}>{selectedEmpName}</div>
                <div style={S.employeeId}>{selectedEmpId}</div>
              </div>
            )}

            {attendanceRecord && (
              <div
                style={{
                  ...S.attendanceCard,
                  background: isCheckedIn ? "#fff7ed" : "#ecfdf5",
                  borderColor: isCheckedIn ? "#fed7aa" : "#a7f3d0",
                }}
              >
                <div style={S.attendanceTitle}>
                  {isCheckedIn ? "Already Checked In" : "Today Completed"}
                </div>

                <div style={S.attendanceRow}>
                  <span>Check In</span>
                  <b>{formatTime(attendanceRecord.checkInAt)}</b>
                </div>

                <div style={S.attendanceRow}>
                  <span>Check Out</span>
                  <b>
                    {attendanceRecord.checkOutAt
                      ? formatTime(attendanceRecord.checkOutAt)
                      : "-"}
                  </b>
                </div>

                <div style={S.timerBox}>
                  <span>
                    {isCheckedIn ? "Running Timer" : "Total Duration"}
                  </span>
                  <strong>{runningDuration}</strong>
                </div>
              </div>
            )}

            {lastResult && (
              <div
                style={{
                  ...S.resultBadge,
                  background: lastResult.success ? "#ecfdf5" : "#fef2f2",
                  borderColor: lastResult.success ? "#a7f3d0" : "#fecaca",
                  color: lastResult.success ? "#047857" : "#dc2626",
                }}
              >
                {lastResult.success ? "✓" : "✕"} {lastResult.message}
              </div>
            )}
          </div>

          <div className="kiosk-right" style={S.rightPanel}>
            {cameraActive ? (
              <>
                <div className="kiosk-camera-wrap">
                  {cam.camError ? (
                    <div style={S.errorOverlay}>
                      <MdError style={{ fontSize: 56, marginBottom: 12 }} />
                      <div style={S.errorTitle}>{cam.camError}</div>
                      <div style={S.errorText}>
                        Check browser camera permission
                      </div>
                    </div>
                  ) : (
                    <video ref={cam.videoRef} autoPlay muted playsInline />
                  )}
                </div>

                <div style={S.statusBar}>
                  <span
                    style={{
                      ...S.statusDot,
                      background: scanning
                        ? "#f59e0b"
                        : cam.camError
                          ? "#ef4444"
                          : "#10b981",
                    }}
                  />

                  <span style={S.statusText}>
                    {scanning
                      ? "Scanning..."
                      : cam.camError
                        ? "Camera Error"
                        : "Ready"}
                  </span>
                </div>

                <div className="button-grid" style={S.buttonGrid}>
                  <button
                    onClick={handleCheckIn}
                    disabled={
                      !selectedEmpId ||
                      scanning ||
                      !!cam.camError ||
                      isCheckedIn ||
                      isCheckedOut
                    }
                    style={{
                      ...S.btnAction,
                      ...S.btnCheckIn,
                      opacity:
                        !selectedEmpId ||
                        scanning ||
                        cam.camError ||
                        isCheckedIn ||
                        isCheckedOut
                          ? 0.5
                          : 1,
                      cursor:
                        !selectedEmpId ||
                        scanning ||
                        cam.camError ||
                        isCheckedIn ||
                        isCheckedOut
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isCheckedIn ? "Already Checked In" : "Check In"}
                  </button>

                  <button
                    onClick={handleCheckOut}
                    disabled={
                      !selectedEmpId ||
                      scanning ||
                      !!cam.camError ||
                      !isCheckedIn ||
                      isCheckedOut
                    }
                    style={{
                      ...S.btnAction,
                      ...S.btnCheckOut,
                      opacity:
                        !selectedEmpId ||
                        scanning ||
                        cam.camError ||
                        !isCheckedIn ||
                        isCheckedOut
                          ? 0.5
                          : 1,
                      cursor:
                        !selectedEmpId ||
                        scanning ||
                        cam.camError ||
                        !isCheckedIn ||
                        isCheckedOut
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isCheckedOut ? "Already Checked Out" : "Check Out"}
                  </button>
                </div>

                {isCheckedIn && (
                  <div style={S.infoBox}>
                    This employee is already checked in today. Click Check Out
                    to stop timer.
                  </div>
                )}

                {isCheckedOut && (
                  <div style={S.successBox}>
                    Today attendance completed. Timer stopped.
                  </div>
                )}
              </>
            ) : (
              <div style={S.placeholderState}>
                <BsFillCameraFill style={S.placeholderIcon} />
                <div style={S.placeholderTitle}>Camera Inactive</div>
                <div style={S.placeholderText}>
                  Select an employee to activate camera
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <canvas ref={cam.canvasRef} style={{ display: "none" }} />
    </div>
  );
}

const S = {
  passcodePageWrapper: {
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },
  passcodeContainer: {
    width: "100%",
    maxWidth: 450,
  },
  passcodeCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "48px 38px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  passcodeHeader: {
    textAlign: "center",
    marginBottom: 36,
  },
  lockIcon: {
    fontSize: 54,
    marginBottom: 10,
  },
  passcodeTitle: {
    fontSize: 30,
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: 6,
  },
  passcodeSubTitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: 0,
    fontWeight: 500,
  },
  passcodeForm: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  passcodeError: {
    fontSize: 13,
    color: "#ef4444",
    marginTop: 8,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#374151",
    display: "block",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    background: "#f9fafb",
    color: "#1f2937",
    fontWeight: 700,
    letterSpacing: "0.2em",
  },
  btnPasscodeSubmit: {
    padding: "14px 24px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 16,
    color: "#ffffff",
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
    width: "100%",
  },

  mainPageWrapper: {
    background: "linear-gradient(to bottom, #f8f9ff 0%, #f0f4ff 100%)",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },
  header: {
    background: "linear-gradient(to right, #ffffff 0%, #f0f4ff 100%)",
    borderBottom: "2px solid #e5e7eb",
    padding: 20,
    boxShadow: "0 2px 8px rgba(79,70,229,0.08)",
  },
  headerContent: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 40,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 18,
  },
  logoText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#1f2937",
    letterSpacing: "0.5px",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  title: {
    fontSize: "clamp(22px, 4vw, 30px)",
    fontWeight: 900,
    color: "#1f2937",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    margin: 0,
    fontWeight: 600,
  },
  timeDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  time: {
    fontSize: 20,
    fontWeight: 900,
    color: "#4f46e5",
    lineHeight: 1,
  },
  date: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 5,
    fontWeight: 700,
  },
  mainContent: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "30px 20px",
    width: "100%",
    boxSizing: "border-box",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 28,
  },
  leftPanel: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "clamp(16px, 4vw, 28px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    height: "fit-content",
  },
  rightPanel: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "clamp(16px, 4vw, 28px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    minHeight: 600,
  },
  formGroup: {
    marginBottom: 26,
  },
  select: {
    width: "100%",
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#1f2937",
    background: "#f8fafc",
    outline: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  loadingState: {
    padding: 14,
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    background: "#f1f5f9",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    fontWeight: 700,
  },
  employeeCard: {
    padding: 16,
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1.5px solid #a7f3d0",
    color: "#047857",
    marginTop: 10,
  },
  employeeLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 19,
    fontWeight: 900,
    color: "#047857",
  },
  employeeId: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 800,
    color: "#065f46",
  },
  attendanceCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    border: "1.5px solid",
  },
  attendanceTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 12,
  },
  attendanceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#374151",
    marginBottom: 10,
    gap: 10,
  },
  timerBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  resultBadge: {
    padding: 14,
    borderRadius: 12,
    border: "1.5px solid",
    fontSize: 14,
    fontWeight: 800,
    textAlign: "center",
    marginTop: 20,
  },
  statusBar: {
    marginTop: 16,
    padding: "12px 16px",
    background: "#f1f5f9",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    border: "1px solid #e2e8f0",
  },
  statusDot: {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 20,
  },
  btnAction: {
    padding: "16px 10px",
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 14,
    color: "#ffffff",
    border: "none",
    width: "100%",
    textTransform: "uppercase",
  },
  btnCheckIn: {
    background: "#10b981",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  },
  btnCheckOut: {
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
  },
  infoBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
  successBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
  errorOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fca5a5",
    padding: 20,
    textAlign: "center",
    background: "rgba(0,0,0,0.8)",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    opacity: 0.85,
  },
  placeholderState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 64,
    color: "#d1d5db",
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#6b7280",
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: 600,
  },
};
