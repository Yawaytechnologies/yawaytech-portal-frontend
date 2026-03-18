// src/pages/EmployeeFaceScan.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { BsFillCameraFill } from "react-icons/bs";
import { MdCheckCircle, MdError, MdRefresh, MdAccessTime, MdLogout } from "react-icons/md";
import { selectEmployeeId } from "../redux/reducer/authSlice";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://yawaytech-portal-backend-python-2.onrender.com").replace(/\/$/, "");

// ─── Oval crop constants — must match CSS overlay ────────────────────────────
const OVAL_WIDTH_RATIO = 0.42;
const OVAL_ASPECT = 0.85;

// ─── API: POST /api/check-in-with-face ───────────────────────────────────────
async function apiCheckIn(imageBlob, employeeId) {
    if (!employeeId) throw new Error("Employee ID missing. Please log in again.");
    const form = new FormData();
    form.append("selfie", imageBlob, "face.jpg");
    const res = await fetch(
        `${BASE_URL}/api/check-in-with-face?employeeId=${encodeURIComponent(employeeId)}`,
        { method: "POST", body: form }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err?.detail;
        throw new Error(
            typeof detail === "string" ? detail
                : Array.isArray(detail) ? detail[0]?.msg || detail[0]
                    : `Check-in failed (${res.status})`
        );
    }
    return res.json();
}

// ─── API: POST /api/check-out-with-face ──────────────────────────────────────
async function apiCheckOut(imageBlob, employeeId) {
    if (!employeeId) throw new Error("Employee ID missing. Please log in again.");
    const form = new FormData();
    form.append("selfie", imageBlob, "face.jpg");
    const res = await fetch(
        `${BASE_URL}/api/check-out-with-face?employeeId=${encodeURIComponent(employeeId)}`,
        { method: "POST", body: form }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err?.detail;
        throw new Error(
            typeof detail === "string" ? detail
                : Array.isArray(detail) ? detail[0]?.msg || detail[0]
                    : `Check-out failed (${res.status})`
        );
    }
    return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(utcString) {
    if (!utcString) return "--";
    return new Date(utcString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatWorked(seconds) {
    if (!seconds) return "--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

// ─── Camera Hook ──────────────────────────────────────────────────────────────
function useCamera() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [camError, setCamError] = useState(null);

    const startCamera = useCallback(async () => {
        setCamError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch {
            setCamError("Camera access denied. Please allow camera permission.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    const captureBlob = useCallback(
        () =>
            new Promise((resolve) => {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                if (!canvas || !video) return resolve(null);

                const vw = video.videoWidth || 640;
                const vh = video.videoHeight || 480;

                const ovalW = vw * OVAL_WIDTH_RATIO;
                const ovalH = ovalW / OVAL_ASPECT;
                const srcX = (vw - ovalW) / 2;
                const srcY = (vh - ovalH) / 2;

                canvas.width = Math.round(ovalW);
                canvas.height = Math.round(ovalH);

                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, srcX, srcY, ovalW, ovalH, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
            }),
        []
    );

    useEffect(() => () => stopCamera(), [stopCamera]);
    return { videoRef, canvasRef, camError, startCamera, stopCamera, captureBlob };
}

// ─── CameraPanel ──────────────────────────────────────────────────────────────
function CameraPanel({ cam, actionLabel, actionColor, onCapture, onCancel, scanning }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", aspectRatio: "4/3" }}>
                {cam.camError ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#f87171", padding: 24, textAlign: "center" }}>
                        <MdError style={{ fontSize: 48 }} />
                        <p style={{ fontSize: 13 }}>{cam.camError}</p>
                    </div>
                ) : (
                    <>
                        <video ref={cam.videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "42%", aspectRatio: "0.85", borderRadius: "50%", border: `2px solid ${actionColor}`, boxShadow: `0 0 28px ${actionColor}55` }} />
                            <div className="emp-scan-line" style={{ "--scan-color": actionColor }} />
                            {[
                                { top: 10, left: 10, borderTop: `2px solid ${actionColor}`, borderLeft: `2px solid ${actionColor}`, borderRadius: "4px 0 0 0" },
                                { top: 10, right: 10, borderTop: `2px solid ${actionColor}`, borderRight: `2px solid ${actionColor}`, borderRadius: "0 4px 0 0" },
                                { bottom: 10, left: 10, borderBottom: `2px solid ${actionColor}`, borderLeft: `2px solid ${actionColor}`, borderRadius: "0 0 0 4px" },
                                { bottom: 10, right: 10, borderBottom: `2px solid ${actionColor}`, borderRight: `2px solid ${actionColor}`, borderRadius: "0 0 4px 0" },
                            ].map((s, i) => <div key={i} style={{ position: "absolute", width: 20, height: 20, ...s }} />)}
                            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "6px 16px", fontSize: 11, color: actionColor, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: actionColor, display: "inline-block", animation: "empPulse 1s infinite" }} />
                                LIVE · Look straight into camera
                            </div>
                        </div>
                    </>
                )}
            </div>
            <canvas ref={cam.canvasRef} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: 12 }}>
                <button onClick={onCapture} disabled={!!cam.camError || scanning}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "white", background: actionColor, border: "none", cursor: cam.camError || scanning ? "not-allowed" : "pointer", opacity: cam.camError || scanning ? 0.6 : 1, boxShadow: `0 4px 14px ${actionColor}44` }}>
                    {scanning ? "Scanning..." : `📸 ${actionLabel}`}
                </button>
                <button onClick={onCancel} style={{ padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer" }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmployeeFaceScan() {
    const camIn = useCamera();
    const camOut = useCamera();

    const employeeId = useSelector(selectEmployeeId);
    const token = useSelector((s) => s.auth?.token || s.auth?.user?.token || null);

    const [modeIn, setModeIn] = useState("idle");
    const [resultIn, setResultIn] = useState(null);
    const [errorIn, setErrorIn] = useState("");

    const [modeOut, setModeOut] = useState("idle");
    const [resultOut, setResultOut] = useState(null);
    const [errorOut, setErrorOut] = useState("");

    // ── CHECK IN ─────────────────────────────────────────────────────────────
    const startCheckIn = async () => {
        setModeIn("camera"); setErrorIn(""); setResultIn(null);
        await camIn.startCamera();
    };

    const captureCheckIn = async () => {
        setModeIn("scanning");
        const blob = await camIn.captureBlob();
        if (!blob) { setModeIn("camera"); return; }
        camIn.stopCamera();
        try {
            const res = await apiCheckIn(blob, employeeId);
            setResultIn(res);
            setModeIn("success");
        } catch (err) {
            setErrorIn(err.message || "Check-in failed.");
            setModeIn("error");
        }
    };

    const resetCheckIn = () => {
        camIn.stopCamera();
        setModeIn("idle"); setResultIn(null); setErrorIn("");
    };

    // ── CHECK OUT ────────────────────────────────────────────────────────────
    const startCheckOut = async () => {
        setModeOut("camera"); setErrorOut(""); setResultOut(null);
        await camOut.startCamera();
    };

    const captureCheckOut = async () => {
        setModeOut("scanning");
        const blob = await camOut.captureBlob();
        if (!blob) { setModeOut("camera"); return; }
        camOut.stopCamera();
        try {
            const res = await apiCheckOut(blob, employeeId);
            setResultOut(res);
            setModeOut("success");
        } catch (err) {
            setErrorOut(err.message || "Check-out failed.");
            setModeOut("error");
        }
    };

    const resetCheckOut = () => {
        camOut.stopCamera();
        setModeOut("idle"); setResultOut(null); setErrorOut("");
    };

    const card = { background: "white", borderRadius: 16, border: "1px solid #f0f0f0", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

    if (!token) {
        return (
            <div style={{ background: "#f4f6fb", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 20, height: 20, border: "3px solid #fed7aa", borderTopColor: "#FF5800", borderRadius: "50%", animation: "empSpinner 0.8s linear infinite" }} />
                    <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>Authenticating...</p>
                </div>
                <style>{`@keyframes empSpinner { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ background: "#f4f6fb", minHeight: "100%" }}>
            <style>{`
                @keyframes empScanline { 0% { top: 15%; } 100% { top: 80%; } }
                .emp-scan-line {
                    animation: empScanline 2s ease-in-out infinite alternate;
                    position: absolute;
                    left: calc(50% - 70px); right: calc(50% - 70px);
                    height: 2px;
                    background: linear-gradient(to right, transparent, var(--scan-color, #FF5800), transparent);
                }
                @keyframes empPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @media (max-width: 768px) { .emp-main-grid { grid-template-columns: 1fr !important; } }
            `}</style>

            {/* PAGE TITLE */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                    Face <span style={{ color: "#FF5800" }}>Attendance</span>
                </h1>
                <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>Use your face to check in and check out for the day</p>
            </div>

            {/* DATE BANNER */}
            <div style={{ marginBottom: 24, borderRadius: 12, background: "#18234b", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MdAccessTime style={{ color: "#FF5800", fontSize: 22 }} />
                    <div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Today</p>
                        <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "2px 0 0" }}>
                            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {employeeId && (
                        <span style={{ color: "#FF5800", fontFamily: "monospace", fontSize: 13, fontWeight: 700, background: "rgba(255,88,0,0.15)", padding: "4px 12px", borderRadius: 20 }}>
                            {employeeId}
                        </span>
                    )}
                    <div style={{ color: "white", fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>
                        {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            </div>

            {/* Warning if employeeId missing */}
            {!employeeId && (
                <div style={{ marginBottom: 24, borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                    <MdError style={{ color: "#ef4444", fontSize: 20, flexShrink: 0 }} />
                    <p style={{ color: "#ef4444", fontSize: 13, margin: 0, fontWeight: 600 }}>
                        Employee ID not found. Please log out and log in again.
                    </p>
                </div>
            )}

            {/* INSTRUCTIONS */}
            <div style={{ marginBottom: 24, borderRadius: 12, border: "1px solid #fed7aa", background: "#fff7ed", padding: "12px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <BsFillCameraFill style={{ color: "#FF5800", fontSize: 20, marginTop: 2, flexShrink: 0 }} />
                <div>
                    <p style={{ color: "#FF5800", fontWeight: 600, fontSize: 14, margin: 0 }}>Face Recognition Attendance</p>
                    <p style={{ color: "#6b7280", fontSize: 12, margin: "4px 0 0" }}>
                        Click <strong>Check In</strong> when you arrive · Click <strong>Check Out</strong> when you leave.
                        Your face must be enrolled by admin first.
                    </p>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="emp-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                {/* ── CHECK IN ── */}
                <div style={card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MdAccessTime style={{ fontSize: 22, color: "#16a34a" }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 800, fontSize: 16, color: "#1f2937", margin: 0 }}>Check In</p>
                            <p style={{ color: "#9ca3af", fontSize: 12, margin: "2px 0 0" }}>Mark your arrival</p>
                        </div>
                        {modeIn === "success" && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: 20 }}>✓ Checked In</span>}
                    </div>

                    {modeIn === "idle" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "2px dashed #86efac", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <BsFillCameraFill style={{ fontSize: 34, color: "#86efac" }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontWeight: 600, color: "#374151", margin: 0 }}>Ready to Check In</p>
                                <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>Click below to open camera</p>
                            </div>
                            <button onClick={startCheckIn} disabled={!employeeId}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "white", background: !employeeId ? "#86efac" : "#16a34a", border: "none", cursor: !employeeId ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                                <BsFillCameraFill /> Start Check In
                            </button>
                        </div>
                    )}

                    {(modeIn === "camera" || modeIn === "scanning") && (
                        <CameraPanel cam={camIn} actionLabel="Check In Now" actionColor="#16a34a" onCapture={captureCheckIn} onCancel={resetCheckIn} scanning={modeIn === "scanning"} />
                    )}

                    {modeIn === "success" && resultIn && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0" }}>
                                <MdCheckCircle style={{ fontSize: 56, color: "#22c55e" }} />
                                <p style={{ fontWeight: 800, fontSize: 18, color: "#1f2937", margin: 0 }}>Checked In!</p>
                            </div>
                            <div style={{ borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                                <Row label="Employee ID" value={resultIn.employeeId} mono />
                                <Row label="Check In Time" value={formatTime(resultIn.checkInUtc)} mono accent="#16a34a" />
                                <Row label="Work Date" value={resultIn.workDateLocal} mono />
                                {resultIn.faceVerification && (<>
                                    <Row label="Face Verified" value={resultIn.faceVerification.verified ? "Yes ✓" : "No ✗"} accent={resultIn.faceVerification.verified ? "#16a34a" : "#ef4444"} />
                                    <Row label="Confidence" value={`${(resultIn.faceVerification.confidence_score * 100).toFixed(1)}%`} mono accent="#16a34a" />
                                    {resultIn.faceVerification.message && <Row label="Message" value={resultIn.faceVerification.message} />}
                                </>)}
                            </div>
                            <button onClick={resetCheckIn} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, fontWeight: 600, fontSize: 13, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer" }}>
                                <MdRefresh /> Reset
                            </button>
                        </div>
                    )}

                    {modeIn === "error" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "20px 0", textAlign: "center" }}>
                            <MdError style={{ fontSize: 52, color: "#f87171" }} />
                            <div>
                                <p style={{ fontWeight: 700, color: "#1f2937", margin: 0 }}>Check In Failed</p>
                                <p style={{ color: "#ef4444", fontSize: 13, margin: "6px 0 0" }}>{errorIn}</p>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={startCheckIn} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, color: "white", background: "#16a34a", border: "none", cursor: "pointer" }}><MdRefresh /> Retry</button>
                                <button onClick={resetCheckIn} style={{ padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer" }}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── CHECK OUT ── */}
                <div style={card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MdLogout style={{ fontSize: 22, color: "#FF5800" }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 800, fontSize: 16, color: "#1f2937", margin: 0 }}>Check Out</p>
                            <p style={{ color: "#9ca3af", fontSize: 12, margin: "2px 0 0" }}>Mark your departure</p>
                        </div>
                        {modeOut === "success" && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#FF5800", background: "#fff7ed", border: "1px solid #fed7aa", padding: "4px 12px", borderRadius: 20 }}>✓ Checked Out</span>}
                    </div>

                    {modeOut === "idle" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff7ed", border: "2px dashed #fdba74", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <BsFillCameraFill style={{ fontSize: 34, color: "#fdba74" }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontWeight: 600, color: "#374151", margin: 0 }}>Ready to Check Out</p>
                                <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>Click below to open camera</p>
                            </div>
                            <button onClick={startCheckOut} disabled={!employeeId}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "white", background: !employeeId ? "#fdba74" : "#FF5800", border: "none", cursor: !employeeId ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(255,88,0,0.3)" }}>
                                <BsFillCameraFill /> Start Check Out
                            </button>
                        </div>
                    )}

                    {(modeOut === "camera" || modeOut === "scanning") && (
                        <CameraPanel cam={camOut} actionLabel="Check Out Now" actionColor="#FF5800" onCapture={captureCheckOut} onCancel={resetCheckOut} scanning={modeOut === "scanning"} />
                    )}

                    {modeOut === "success" && resultOut && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0" }}>
                                <MdCheckCircle style={{ fontSize: 56, color: "#FF5800" }} />
                                <p style={{ fontWeight: 800, fontSize: 18, color: "#1f2937", margin: 0 }}>Checked Out!</p>
                            </div>
                            <div style={{ borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                                <Row label="Employee ID" value={resultOut.employeeId} mono />
                                <Row label="Check In" value={formatTime(resultOut.checkInUtc)} mono />
                                <Row label="Check Out" value={formatTime(resultOut.checkOutUtc)} mono accent="#FF5800" />
                                <Row label="Hours Worked" value={formatWorked(resultOut.workedSeconds)} mono accent="#FF5800" />
                                {resultOut.faceVerification && (<>
                                    <Row label="Face Verified" value={resultOut.faceVerification.verified ? "Yes ✓" : "No ✗"} accent={resultOut.faceVerification.verified ? "#16a34a" : "#ef4444"} />
                                    <Row label="Confidence" value={`${(resultOut.faceVerification.confidence_score * 100).toFixed(1)}%`} mono accent="#FF5800" />
                                    {resultOut.faceVerification.message && <Row label="Message" value={resultOut.faceVerification.message} />}
                                </>)}
                            </div>
                            <button onClick={resetCheckOut} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, fontWeight: 600, fontSize: 13, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer" }}>
                                <MdRefresh /> Reset
                            </button>
                        </div>
                    )}

                    {modeOut === "error" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "20px 0", textAlign: "center" }}>
                            <MdError style={{ fontSize: 52, color: "#f87171" }} />
                            <div>
                                <p style={{ fontWeight: 700, color: "#1f2937", margin: 0 }}>Check Out Failed</p>
                                <p style={{ color: "#ef4444", fontSize: 13, margin: "6px 0 0" }}>{errorOut}</p>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={startCheckOut} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, color: "white", background: "#FF5800", border: "none", cursor: "pointer" }}><MdRefresh /> Retry</button>
                                <button onClick={resetCheckOut} style={{ padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer" }}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ label, value, mono, accent }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "#9ca3af" }}>{label}</span>
            <span style={{ fontFamily: mono ? "monospace" : "inherit", fontWeight: 600, color: accent || "#1f2937" }}>{value}</span>
        </div>
    );
}