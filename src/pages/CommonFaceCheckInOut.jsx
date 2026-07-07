// src/pages/CommonFaceCheckInOut.jsx
// Professional Face Check-In/Check-Out Kiosk

import React, { useState, useRef, useCallback, useEffect } from "react";
import { BsFillCameraFill } from "react-icons/bs";
import { MdError, MdCheckCircle } from "react-icons/md";
import { FiCheck, FiX } from "react-icons/fi";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://yawaytech-portal-backend-python-2.onrender.com").replace(/\/$/, "");
const PASSCODE = import.meta.env.VITE_KIOSK_PASSCODE || "Admin@123";
const DEPARTMENTS = ["HR", "IT", "Marketing", "Finance", "Sales"];
const FIELD_NAME = "selfie";

// ─── CAMERA HOOK ────────────────────────────────────────────────────────────
const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camError, setCamError] = useState(null);

  const startCamera = useCallback(async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => console.error("Play error:", err));
        };
        videoRef.current.play().catch(err => console.warn("Initial play failed:", err));
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera error:", err);
      setCamError(err.message || "Camera access denied");
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
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const ovalW = vw * 0.42;
    const ovalH = ovalW / 0.85;
    const srcX = (vw - ovalW) / 2;
    const srcY = (vh - ovalH) / 2;

    canvas.width = Math.round(ovalW);
    canvas.height = Math.round(ovalH);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, srcX, srcY, ovalW, ovalH, 0, 0, canvas.width, canvas.height);

    return new Promise((res) => {
      canvas.toBlob((blob) => res(blob), "image/jpeg", 0.92);
    });
  }, []);

  return { videoRef, canvasRef, camError, startCamera, stopCamera, captureBlob };
};

// ─── API FUNCTIONS ──────────────────────────────────────────────────────────
async function apiCheckIn(employeeId, imageBlob) {
  const form = new FormData();
  form.append(FIELD_NAME, imageBlob, "face.jpg");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${BASE_URL}/api/check-in-with-face?employeeId=${encodeURIComponent(employeeId)}`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail = err?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail[0]?.msg || detail[0] : `Failed (${res.status})`;
      throw new Error(msg);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiCheckOut(employeeId, imageBlob) {
  const form = new FormData();
  form.append(FIELD_NAME, imageBlob, "face.jpg");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${BASE_URL}/api/check-out-with-face?employeeId=${encodeURIComponent(employeeId)}`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail = err?.detail;
      const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail[0]?.msg || detail[0] : `Failed (${res.status})`;
      throw new Error(msg);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiFetchEmployees(dept) {
  const res = await fetch(`${BASE_URL}/api/department/${encodeURIComponent(dept)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to load employees: ${res.status}`);
  return res.json();
}

// ─── TOAST NOTIFICATION ─────────────────────────────────────────────────────
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  const bgColor = type === "success" ? "#10b981" : "#ef4444";

  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9999;
    animation: slideInUp 0.3s ease-out;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    max-width: 90vw;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutDown 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── YAWAY HEADER (PORTAL STYLE) ────────────────────────────────────────────
function YawayHeader() {
  return (
    <header style={S.header}>
      <div style={S.headerContent}>
        <div style={S.headerLeft}>
          <div style={S.logo}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 18
            }}>Y</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginLeft: 10, letterSpacing: "0.5px", textTransform: "uppercase" }}>YAWAY PORTAL</span>
          </div>
        </div>
        <div style={S.headerTitle}>
          <h1 style={S.title}>Face Recognition</h1>
          <p style={S.subtitle}>Secure Check-In / Check-Out</p>
        </div>
        <div style={S.headerRight}>
          <div style={S.timeDisplay}>
            <div style={S.time}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
            <div style={S.date}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function CommonFaceCheckInOut() {
  // Auth
  const [authed, setAuthed] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Main state
  const [selectedDept, setSelectedDept] = useState("");
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedEmpName, setSelectedEmpName] = useState("");

  // Camera & scanning
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const cam = useCamera();
  const streamStartedRef = useRef(false);

  // ────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cameraActive && cam.videoRef.current && !streamStartedRef.current) {
      streamStartedRef.current = true;
      setTimeout(() => cam.startCamera(), 100);
    } else if (!cameraActive) {
      streamStartedRef.current = false;
    }
  }, [cameraActive]);

  // ────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ────────────────────────────────────────────────────────────────────────

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcodeInput === PASSCODE) {
      setAuthed(true);
      setPasscodeInput("");
      setPasscodeError("");
    } else {
      setPasscodeError("Incorrect passcode");
      setPasscodeInput("");
    }
  };

  const handleDeptChange = async (e) => {
    const dept = e.target.value;
    setSelectedDept(dept);
    setSelectedEmpId("");
    setSelectedEmpName("");
    cam.stopCamera();
    setLastResult(null);

    if (!dept) {
      setEmployees([]);
      return;
    }

    setEmpLoading(true);
    try {
      const list = await apiFetchEmployees(dept);
      const normalized = Array.isArray(list)
        ? list.map((e) => ({ id: e.employee_id || e.id || "", name: e.name || "Unknown" }))
        : [];
      setEmployees(normalized);
    } catch (err) {
      console.warn("Failed to fetch employees:", err.message);
      setEmployees([]);
    } finally {
      setEmpLoading(false);
    }
  };

  const handleEmpChange = (e) => {
    const empId = e.target.value;
    const empName = employees.find(emp => emp.id === empId)?.name || "";

    setSelectedEmpId(empId);
    setSelectedEmpName(empName);
    setLastResult(null);

    if (empId) {
      cam.stopCamera();
      streamStartedRef.current = false;
      setCameraActive(false); // Force reset first
      setTimeout(() => setCameraActive(true), 50); // Then restart
    } else {
      cam.stopCamera();
      setCameraActive(false);
      streamStartedRef.current = false;
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmpId) return;
    setScanning(true);
    try {
      const blob = await cam.captureBlob();
      if (!blob) throw new Error("Failed to capture face");
      await apiCheckIn(selectedEmpId, blob);
      showToast(`✓ ${selectedEmpName} checked in successfully`);
      setLastResult({ type: "checkin", success: true, message: `✓ Check-in successful` });
      setSelectedEmpId("");
      setSelectedEmpName("");
    } catch (err) {
      showToast(err.message || "Check-in failed", "error");
      setLastResult({ type: "checkin", success: false, message: err.message || "Check-in failed" });
    } finally {
      setScanning(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmpId) return;
    setScanning(true);
    try {
      const blob = await cam.captureBlob();
      if (!blob) throw new Error("Failed to capture face");
      await apiCheckOut(selectedEmpId, blob);
      showToast(`✓ ${selectedEmpName} checked out successfully`);
      setLastResult({ type: "checkout", success: true, message: `✓ Check-out successful` });
      setSelectedEmpId("");
      setSelectedEmpName("");
    } catch (err) {
      showToast(err.message || "Check-out failed", "error");
      setLastResult({ type: "checkout", success: false, message: err.message || "Check-out failed" });
    } finally {
      setScanning(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER: PASSCODE SCREEN
  // ────────────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div style={S.passcodePageWrapper}>
        <style>{`
          @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slideOutDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>

        <div style={S.passcodeContainer}>
          <div style={S.passcodeCard}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 56, fontWeight: 800, marginBottom: 12 }}>
                <span style={{ color: "#FF5800" }}>🔐</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>
                Secure Access
              </div>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>Enter passcode to access kiosk</p>
            </div>

            {/* Form */}
            <form onSubmit={handlePasscodeSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                  <div style={{ fontSize: 13, color: "#ef4444", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
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

  // ────────────────────────────────────────────────────────────────────────
  // RENDER: MAIN SCREEN
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div style={S.mainPageWrapper}>
      <style>{`
        @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideOutDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }
        @keyframes faceScanline { 0%{top:20%} 100%{top:75%} }

        .face-scan-line {
          animation: faceScanline 2.5s ease-in-out infinite alternate;
          position: absolute;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(to right, transparent, #4f46e5, transparent);
          box-shadow: 0 0 8px rgba(79,70,229,0.6);
        }

        .kiosk-camera-wrap {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          width: 100%;
          aspect-ratio: 4/3;
        }

        .kiosk-camera-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .face-oval {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 42%;
          max-width: 170px;
          aspect-ratio: 0.85;
          border-radius: 50%;
          border: 3px solid #4f46e5;
          box-shadow: 0 0 20px rgba(79,70,229,0.4), inset 0 0 15px rgba(79,70,229,0.15);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .kiosk-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
          }
          .kiosk-left {
            order: 2;
            min-height: auto !important;
            width: 100% !important;
          }
          .kiosk-right {
            order: 1;
            width: 100% !important;
            min-height: 400px !important;
          }
          main {
            padding: 20px 12px !important;
          }
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column !important;
            gap: 16px !important;
          }
          h1 {
            font-size: 24px !important;
          }
          .header-time {
            text-align: center !important;
          }
        }

        @media (max-width: 480px) {
          .kiosk-camera-wrap {
            aspect-ratio: 3/2 !important;
          }
          .face-oval {
            width: 50% !important;
          }
          main {
            padding: 16px 8px !important;
          }
          h1 {
            font-size: 20px !important;
          }
        }
      `}</style>

      {/* YAWAY HEADER */}
      <YawayHeader />

      {/* MAIN CONTENT */}
      <main style={S.mainContent}>
        <div className="kiosk-grid" style={S.container}>
          {/* LEFT PANEL: CONTROLS */}
          <div className="kiosk-left" style={S.leftPanel}>
            {/* Department Selector */}
            <div style={{ marginBottom: 28 }}>
              <label style={S.label}>Department</label>
              <select value={selectedDept} onChange={handleDeptChange} style={S.select}>
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Selector */}
            {selectedDept && (
              <div style={{ marginBottom: 28 }}>
                <label style={S.label}>Employee</label>
                {empLoading ? (
                  <div style={S.loadingState}>
                    ⏳ Loading employees...
                  </div>
                ) : (
                  <select value={selectedEmpId} onChange={handleEmpChange} style={S.select}>
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Employee Info Card */}
            {selectedEmpName && (
              <div style={S.employeeCard}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Current Employee
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#047857", display: "flex", alignItems: "center", gap: 10 }}>
                  <FiCheck size={24} style={{ color: "#10b981" }} />
                  {selectedEmpName}
                </div>
              </div>
            )}

            {/* Result Badge */}
            {lastResult && (
              <div
                style={{
                  ...S.resultBadge,
                  background: lastResult.success ? "#ecfdf5" : "#fef2f2",
                  borderColor: lastResult.success ? "#a7f3d0" : "#fecaca",
                  color: lastResult.success ? "#047857" : "#dc2626",
                }}
              >
                <span style={{ fontSize: 18, marginRight: 8 }}>{lastResult.success ? "✓" : "✕"}</span>
                {lastResult.message}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: CAMERA */}
          <div className="kiosk-right" style={S.rightPanel}>
            {cameraActive ? (
              <>
                {/* Camera Feed */}
                <div className="kiosk-camera-wrap">
                  {cam.camError ? (
                    <div style={S.errorOverlay}>
                      <MdError style={{ fontSize: 56, marginBottom: 12 }} />
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{cam.camError}</div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>Check camera permissions</div>
                    </div>
                  ) : (
                    <>
                      <video ref={cam.videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                        <div className="face-oval" />
                        <div className="face-scan-line" />
                      </div>
                    </>
                  )}
                </div>

                {/* Status Indicator */}
                <div style={S.statusBar}>
                  <span style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: scanning ? "#f59e0b" : cam.camError ? "#ef4444" : "#10b981",
                    marginRight: 8,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {scanning ? "🔍 Scanning..." : cam.camError ? "❌ Error" : "🟢 Ready"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
                  <button
                    onClick={handleCheckIn}
                    disabled={!selectedEmpId || scanning || !!cam.camError}
                    style={{
                      ...S.btnAction,
                      ...S.btnCheckIn,
                      opacity: !selectedEmpId || scanning || cam.camError ? 0.5 : 1,
                      cursor: !selectedEmpId || scanning || cam.camError ? "not-allowed" : "pointer",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>↓</div>
                    <div>CHECK IN</div>
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={!selectedEmpId || scanning || !!cam.camError}
                    style={{
                      ...S.btnAction,
                      ...S.btnCheckOut,
                      opacity: !selectedEmpId || scanning || cam.camError ? 0.5 : 1,
                      cursor: !selectedEmpId || scanning || cam.camError ? "not-allowed" : "pointer",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>↑</div>
                    <div>CHECK OUT</div>
                  </button>
                </div>

                {/* Guidance */}
                {!selectedEmpId && (
                  <div style={S.guidanceBox}>
                    👈 Select an employee from the left panel to begin
                  </div>
                )}
              </>
            ) : (
              <div style={S.placeholderState}>
                <BsFillCameraFill style={{ fontSize: 64, color: "#d1d5db", marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>Camera Inactive</div>
                <div style={{ fontSize: 14, color: "#9ca3af" }}>Select an employee to activate camera</div>
              </div>
            )}
          </div>
        </div>
      </main>

      <canvas ref={cam.canvasRef} style={{ display: "none" }} />
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const S = {
  // ════ PASSCODE SCREEN ════
  passcodePageWrapper: {
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },
  passcodeContainer: {
    width: "100%",
    maxWidth: 450,
  },
  passcodeCard: {
    background: "white",
    borderRadius: 20,
    padding: "50px 40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    animation: "slideInUp 0.4s ease-out",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
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
    fontWeight: 600,
    letterSpacing: "0.2em",
    transition: "all 0.2s ease",
  },
  btnPasscodeSubmit: {
    padding: "14px 24px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 16,
    color: "white",
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
    transition: "all 0.2s ease",
    width: "100%",
  },

  // ════ MAIN SCREEN ════
  mainPageWrapper: {
    background: "linear-gradient(to bottom, #f8f9ff 0%, #f0f4ff 100%)",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },

  // ════ HEADER ════
  header: {
    background: "linear-gradient(to right, #ffffff 0%, #f0f4ff 100%)",
    borderBottom: "2px solid #e5e7eb",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(79,70,229,0.08)",
  },
  headerContent: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 40,
    flexWrap: "wrap",
  },
  headerLeft: {
    flex: "0 0 auto",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  title: {
    fontSize: "clamp(20px, 5vw, 28px)",
    fontWeight: 800,
    color: "#1f2937",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    margin: 0,
    fontWeight: 500,
  },
  headerRight: {
    flex: "0 0 auto",
    textAlign: "right",
  },
  timeDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  time: {
    fontSize: 20,
    fontWeight: 800,
    color: "#4f46e5",
    lineHeight: 1,
  },
  date: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    fontWeight: 500,
  },

  // ════ MAIN CONTENT ════
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
    background: "white",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "clamp(16px, 4vw, 28px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    height: "fit-content",
    minHeight: "auto",
  },
  rightPanel: {
    background: "white",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: "clamp(16px, 4vw, 28px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    minHeight: 600,
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
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  loadingState: {
    padding: "14px",
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    background: "#f1f5f9",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    fontWeight: 600,
  },
  employeeCard: {
    padding: 16,
    borderRadius: 12,
    background: "#ecfdf5",
    border: "1.5px solid #a7f3d0",
    color: "#047857",
    marginTop: 20,
  },
  resultBadge: {
    padding: 14,
    borderRadius: 12,
    border: "1.5px solid",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 20,
    animation: "slideInUp 0.3s ease-out",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  btnAction: {
    padding: "16px 12px",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 14,
    color: "white",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCheckIn: {
    background: "#10b981",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  },
  btnCheckOut: {
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
  },
  guidanceBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#78350f",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
  },
  errorOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#fca5a5",
    padding: 20,
    textAlign: "center",
    background: "rgba(0,0,0,0.8)",
  },
  placeholderState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
};
