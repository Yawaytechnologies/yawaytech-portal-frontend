// src/pages/AdminFaceRegister.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { BsFillCameraFill } from "react-icons/bs";
import { MdOutlineCloudUpload, MdCheckCircle, MdError, MdRefresh } from "react-icons/md";
import { FiUser } from "react-icons/fi";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://yawaytech-portal-backend-python-2.onrender.com").replace(/\/$/, "");
const FIELD_NAME = "file"; // ← update if your API uses a different field name
const DEPARTMENTS = ["HR", "IT", "Marketing", "Finance", "Sales"];

// ─── MODULE-LEVEL CACHE — survives re-renders & StrictMode double mount ───────
let _cachedEmployees = null;
let _fetchPromise = null;

async function fetchAllEmployees(token) {
    if (_cachedEmployees !== null) return _cachedEmployees;
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = Promise.allSettled(
        DEPARTMENTS.map((dept) =>
            fetch(`${BASE_URL}/api/department/${encodeURIComponent(dept)}`, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
            }).then((r) => {
                if (!r.ok) throw new Error(`${dept}: ${r.status}`);
                return r.json();
            })
        )
    ).then((results) => {
        const all = [];
        results.forEach((result, i) => {
            if (result.status === "fulfilled") {
                const data = Array.isArray(result.value) ? result.value : [];
                data.forEach((emp) => {
                    all.push({
                        id: emp.employee_id || emp.id || "",
                        name: emp.name || "Unknown",
                        dept: DEPARTMENTS[i],
                        role: emp.designation || emp.role || "",
                    });
                });
            }
        });

        const seen = new Set();
        const unique = all.filter((e) => {
            if (!e.id || seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });

        _cachedEmployees = unique;
        _fetchPromise = null;
        return unique;
    });

    return _fetchPromise;
}

// ─── Helper: Show success toast ────────────────────────────────────────────────
function showSuccessToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: #22c55e; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 9999; animation: slideInUp 0.3s ease-out;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "slideOutDown 0.3s ease-out";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── API: Check face status via employee profile ─────────────────────────────
async function apiCheckFaceStatus(employeeId, token) {
    const res = await fetch(`${BASE_URL}/api/employee-profiles/${employeeId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err?.detail;
        const msg =
            typeof detail === "string"
                ? detail
                : Array.isArray(detail)
                    ? detail[0]?.msg || detail[0]
                    : `Failed (${res.status})`;
        throw new Error(msg);
    }
    const data = await res.json();
    // ✅ Check if profile_path exists to determine if face is registered
    return {
        face_registered: !!(data.profile_path || data.image_url)
    };
}

// ─── API: Store face image ─────────────────────────────────────────────────────
// FIX #1 (partial): Improved error detail parsing — handles string OR array format
async function apiStoreFace(employeeId, imageBlob, token) {
    const form = new FormData();
    form.append(FIELD_NAME, imageBlob, "face.jpg");
    const res = await fetch(
        `${BASE_URL}/api/employee-profiles/${employeeId}/profile-image`,
        {
            method: "POST",
            body: form,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
        }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // ✅ FIX #1 — Handle both string and array detail formats from FastAPI
        const detail = err?.detail;
        const msg =
            typeof detail === "string"
                ? detail
                : Array.isArray(detail)
                    ? detail[0]?.msg || detail[0]
                    : `Server error ${res.status}`;
        throw new Error(msg);
    }
    return res.json();
}

// ─── Camera Hook ───────────────────────────────────────────────────────────────
// OVAL CONSTANTS — must match the CSS overlay exactly
// CSS overlay: width: 42%, aspectRatio: 0.85, centered
// ─── Oval crop constants — match the CSS overlay ──────────────────────────────
const OVAL_WIDTH_RATIO = 0.42;  // matches: width: "42%" in the overlay CSS
const OVAL_ASPECT = 0.85;  // matches: aspectRatio: "0.85" in the overlay CSS

// ─── Camera Hook ─────────────────────────────────────────────────────────────
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

                // Compute oval bounding box in video pixel space
                const ovalW = vw * OVAL_WIDTH_RATIO;
                const ovalH = ovalW / OVAL_ASPECT;
                const srcX = (vw - ovalW) / 2;
                const srcY = (vh - ovalH) / 2;

                canvas.width = Math.round(ovalW);
                canvas.height = Math.round(ovalH);

                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Crop: only the oval bounding box from the video frame
                ctx.drawImage(
                    video,
                    srcX, srcY, ovalW, ovalH,
                    0, 0, canvas.width, canvas.height
                );

                canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
            }),
        []
    );

    useEffect(() => () => stopCamera(), [stopCamera]);

    return { videoRef, canvasRef, camError, startCamera, stopCamera, captureBlob };
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminFaceRegister() {
    const cam = useCamera();
    const token = useSelector((s) => s.auth?.token || s.auth?.user?.token || null);

    const [employees, setEmployees] = useState(_cachedEmployees || []);
    const [empLoading, setEmpLoading] = useState(_cachedEmployees === null);
    const [empError, setEmpError] = useState(null);

    const [selectedId, setSelectedId] = useState("");
    const [mode, setMode] = useState("idle");
    const [previewUrl, setPreviewUrl] = useState(null);
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [resultData, setResultData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [faceStatusLoading, setFaceStatusLoading] = useState(false);
    const [faceRegistered, setFaceRegistered] = useState(false);
    const [statusCheckDone, setStatusCheckDone] = useState(false); // ✅ Track if initial check is complete

    const selectedEmp = employees.find((e) => e.id === selectedId);

    // ✅ FIX #2 — Token guard: wait for token before fetching employees
    // Also added `token` to dependency array so it re-runs when token becomes available
    useEffect(() => {
        if (_cachedEmployees !== null) {
            setEmployees(_cachedEmployees);
            setEmpLoading(false);
            return;
        }
        if (!token) return; // ← Wait for Redux to hydrate the token

        let active = true;
        setEmpLoading(true);
        fetchAllEmployees(token)
            .then((list) => {
                if (active) { setEmployees(list); setEmpLoading(false); }
            })
            .catch((err) => {
                if (active) { setEmpError(err.message || "Failed to load employees"); setEmpLoading(false); }
            });

        return () => { active = false; };
    }, [token]); // ← token in deps so it retries when token arrives

    // ✅ Check face status when employee is selected
    useEffect(() => {
        if (!selectedId) {
            setFaceRegistered(false);
            setStatusCheckDone(false);
            return;
        }
        let active = true;
        setFaceStatusLoading(true);
        setStatusCheckDone(false); // ✅ Mark check as NOT done yet
        apiCheckFaceStatus(selectedId, token)
            .then((res) => {
                if (active) {
                    setFaceRegistered(res.face_registered || false);
                    setStatusCheckDone(true); // ✅ Mark check as DONE
                    setFaceStatusLoading(false);
                }
            })
            .catch((err) => {
                if (active) {
                    console.warn("Face check failed:", err.message);
                    setFaceRegistered(false);
                    setStatusCheckDone(true); // ✅ Mark check as DONE (even on error)
                    setFaceStatusLoading(false);
                }
            });
        return () => { active = false; };
    }, [selectedId, token]);

    // ✅ Auto-open camera when face is NOT registered (ONLY after status check completes)
    useEffect(() => {
        if (selectedId && statusCheckDone && !faceRegistered && mode === "idle") {
            setMode("camera");
            cam.startCamera();
        }
    }, [selectedId, statusCheckDone, faceRegistered, mode, cam]);

    // ✅ FIX #3 — Helper to safely revoke object URLs and prevent memory leaks
    const safeRevokeUrl = useCallback((url) => {
        if (url && url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
        }
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSelectEmployee = (val) => {
        cam.stopCamera();
        // ✅ FIX #3 — Revoke old preview URL before clearing
        safeRevokeUrl(previewUrl);
        setPreviewUrl(null);
        setCapturedBlob(null);
        setResultData(null);
        setErrorMsg("");
        setUploadProgress(0);
        setMode("idle");
        setSelectedId(val);
        setFaceRegistered(false);
        setFaceStatusLoading(false);
    };

    const handleOpenCamera = async () => { setMode("camera"); await cam.startCamera(); };

    const handleCapture = async () => {
        const blob = await cam.captureBlob();
        if (!blob) return;
        cam.stopCamera();
        // ✅ FIX #3 — Revoke previous preview URL before creating a new one
        safeRevokeUrl(previewUrl);
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setMode("preview");
    };

    const handleRetake = () => {
        // ✅ FIX #3 — Revoke current preview URL on retake
        safeRevokeUrl(previewUrl);
        setPreviewUrl(null);
        setCapturedBlob(null);
        setMode("camera");
        cam.startCamera();
    };

    const handleRetakeExisting = async () => {
        setMode("camera");
        await cam.startCamera();
    };

    const handleGoBack = () => {
        cam.stopCamera();
        safeRevokeUrl(previewUrl);
        setPreviewUrl(null);
        setCapturedBlob(null);
        setResultData(null);
        setErrorMsg("");
        setUploadProgress(0);
        setMode("idle");
        setSelectedId("");
        setFaceRegistered(false);
    };

    const handleUpload = async () => {
        if (!selectedId || !capturedBlob) return;
        setMode("uploading"); setErrorMsg("");
        let prog = 0;
        const interval = setInterval(() => {
            prog += Math.random() * 20;
            if (prog > 85) { clearInterval(interval); prog = 85; }
            setUploadProgress(Math.round(prog));
        }, 150);
        try {
            const res = await apiStoreFace(selectedId, capturedBlob, token);
            clearInterval(interval);
            setUploadProgress(100);
            await new Promise((r) => setTimeout(r, 300));
            if (faceRegistered) showSuccessToast("Face updated successfully");
            // ✅ Mark face as registered after successful upload
            setFaceRegistered(true);
            setResultData(res);
            setMode("success");
        } catch (err) {
            clearInterval(interval);
            setErrorMsg(err.message || "Upload failed. Please try again.");
            setMode("error");
        }
    };

    const handleReset = () => {
        // ✅ FIX #3 — Revoke preview URL on full reset
        safeRevokeUrl(previewUrl);
        setSelectedId("");
        setPreviewUrl(null);
        setCapturedBlob(null);
        setResultData(null);
        setErrorMsg("");
        setUploadProgress(0);
        setMode("idle");
        cam.stopCamera();
    };

    const handleRefreshEmployees = () => {
        _cachedEmployees = null;
        _fetchPromise = null;
        setEmpLoading(true);
        setEmpError(null);
        fetchAllEmployees(token)
            .then((list) => { setEmployees(list); setEmpLoading(false); })
            .catch((err) => { setEmpError(err.message); setEmpLoading(false); });
    };

    return (
        <div style={{ background: "#f4f6fb", minHeight: "100%" }}>
            <style>{`
        @keyframes faceScanline { 0%{top:15%} 100%{top:80%} }
        .face-scan-line {
          animation: faceScanline 2s ease-in-out infinite alternate;
          position: absolute;
          left: calc(50% - 70px); right: calc(50% - 70px);
          height: 2px;
          background: linear-gradient(to right, transparent, #FF5800, transparent);
        }
        @keyframes faceSpinner { to { transform: rotate(360deg); } }
        @keyframes slideInUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideOutDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100px); opacity: 0; } }
        .fid-grid { display: grid; grid-template-columns: 270px 1fr; gap: 20px; }
        @media (max-width: 768px) { .fid-grid { grid-template-columns: 1fr; } }
        .fid-camera-wrap {
          position: relative; border-radius: 12px;
          overflow: hidden; background: #000;
          width: 100%; aspect-ratio: 4/3;
        }
        .fid-camera-wrap video, .fid-camera-wrap img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
      `}</style>

            {/* PAGE TITLE */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                    Face ID · <span style={{ color: "#FF5800" }}>Register Employee</span>
                </h1>
                <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>
                    Capture and store employee face images for attendance verification
                </p>
            </div>

            {/* INFO BANNER */}
            <div style={{ marginBottom: 20, borderRadius: 12, border: "1px solid #fed7aa", background: "#fff7ed", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <BsFillCameraFill style={{ color: "#FF5800", fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                <div>
                    <p style={{ color: "#FF5800", fontWeight: 600, fontSize: 14, margin: 0 }}>Admin: Face Image Registration</p>
                    <p style={{ color: "#6b7280", fontSize: 12, margin: "3px 0 0" }}>
                        Select an employee → capture face → store for attendance verification.
                    </p>
                </div>
            </div>

            <div className="fid-grid">

                {/* LEFT PANEL */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Employee Selector */}
                    <div style={S.card}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <SectionTitle noMargin>Select Employee</SectionTitle>
                            {!empLoading && (
                                <button
                                    onClick={handleRefreshEmployees}
                                    title="Refresh employee list"
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, padding: 2 }}
                                >
                                    <MdRefresh />
                                </button>
                            )}
                        </div>

                        {/* Loading */}
                        {empLoading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: "#9ca3af", fontSize: 13 }}>
                                <div style={{ width: 14, height: 14, border: "2px solid #fed7aa", borderTopColor: "#FF5800", borderRadius: "50%", animation: "faceSpinner 0.8s linear infinite", flexShrink: 0 }} />
                                {!token ? "Waiting for auth..." : "Loading employees..."}
                            </div>
                        )}

                        {/* Error */}
                        {empError && !empLoading && (
                            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ef4444", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span>⚠️ {empError}</span>
                                <button onClick={handleRefreshEmployees} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: 0, whiteSpace: "nowrap" }}>
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Dropdown grouped by department */}
                        {!empLoading && (
                            <select
                                value={selectedId}
                                onChange={(e) => handleSelectEmployee(e.target.value)}
                                disabled={["uploading", "success"].includes(mode)}
                                style={S.select}
                            >
                                <option value="">
                                    {employees.length === 0 ? "No employees found" : "-- Choose employee --"}
                                </option>
                                {DEPARTMENTS.map((dept) => {
                                    const list = employees.filter((e) => e.dept === dept);
                                    if (!list.length) return null;
                                    return (
                                        <optgroup key={dept} label={`── ${dept} (${list.length})`}>
                                            {list.map((e) => (
                                                <option key={e.id} value={e.id}>
                                                    {e.name}  ·  {e.id}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        )}

                        {/* Selected employee chip */}
                        {selectedEmp && (
                            <div style={{ marginTop: 10, borderRadius: 10, background: "#f4f6fb", border: "1px solid #e5e7eb", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={S.avatar}>{selectedEmp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                                <div>
                                    <p style={{ fontWeight: 700, color: "#1f2937", fontSize: 13, margin: 0 }}>{selectedEmp.name}</p>
                                    <p style={{ color: "#9ca3af", fontSize: 11, margin: "2px 0 0" }}>{selectedEmp.role || selectedEmp.dept}</p>
                                    <p style={{ color: "#FF5800", fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>{selectedEmp.id}</p>
                                </div>
                            </div>
                        )}

                        {/* Count */}
                        {!empLoading && employees.length > 0 && (
                            <p style={{ color: "#9ca3af", fontSize: 11, margin: "8px 0 0", textAlign: "right" }}>
                                ✓ {employees.length} employees loaded
                            </p>
                        )}
                    </div>

                    {/* Steps */}
                    <div style={S.card}>
                        <SectionTitle>Steps</SectionTitle>
                        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                            {[
                                { n: 1, label: "Select employee", done: !!selectedId, active: !selectedId },
                                { n: 2, label: "Open camera", done: ["preview", "uploading", "success", "error"].includes(mode), active: mode === "idle" && !!selectedId },
                                { n: 3, label: "Capture face", done: ["preview", "uploading", "success"].includes(mode), active: mode === "camera" },
                                { n: 4, label: "Store to system", done: mode === "success", active: mode === "preview" },
                            ].map(({ n, label, done, active }) => (
                                <li key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, fontSize: 13, border: `1px solid ${done ? "#bbf7d0" : active ? "#fed7aa" : "#f3f4f6"}`, background: done ? "#f0fdf4" : active ? "#fff7ed" : "#f9fafb", color: done ? "#15803d" : active ? "#FF5800" : "#9ca3af" }}>
                                    <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: done ? "#22c55e" : active ? "#FF5800" : "#e5e7eb", color: done || active ? "white" : "#9ca3af" }}>
                                        {done ? "✓" : n}
                                    </span>
                                    {label}
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Tips */}
                    <div style={S.card}>
                        <SectionTitle>Capture Tips</SectionTitle>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                            {[["💡", "Good lighting, no backlight"], ["😐", "Neutral expression, eyes open"], ["📐", "Face centered in oval"], ["🚫", "No sunglasses or mask"], ["📏", "30–50 cm from camera"]].map(([icon, tip]) => (
                                <li key={tip} style={{ display: "flex", gap: 8, fontSize: 12, color: "#6b7280", alignItems: "center" }}>
                                    <span>{icon}</span>{tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div style={{ ...S.card, display: "flex", flexDirection: "column", minHeight: 420, padding: 20 }}>

                    {/* FACE ALREADY CAPTURED */}
                    {mode === "idle" && selectedId && !empLoading && faceRegistered && !faceStatusLoading && (
                        <div style={S.center}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MdCheckCircle style={{ fontSize: 48, color: "#22c55e" }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "inline-block", padding: "5px 12px", borderRadius: 20, marginBottom: 12 }}>
                                    ✓ Face Already Captured
                                </div>
                                <p style={{ fontWeight: 700, color: "#374151", margin: 0, fontSize: 15 }}>Face has been registered</p>
                                <p style={{ color: "#6b7280", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>
                                    A face has already been captured for this employee. You can retake it if needed.
                                </p>
                            </div>
                            <div style={{ display: "flex", gap: 10, width: "100%" }}>
                                <button onClick={handleRetakeExisting} style={{ ...S.btnPrimary(false), flex: 1, background: "white", color: "#FF5800", border: "2px solid #FF5800" }}>Retake</button>
                                <button onClick={handleGoBack} style={{ ...S.btnOutline, flex: 1, color: "#1f2937", borderColor: "#d1d5db" }}>Go Back</button>
                            </div>
                        </div>
                    )}

                    {/* IDLE */}
                    {mode === "idle" && (!selectedId || !faceRegistered || faceStatusLoading) && (
                        <div style={S.center}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f4f6fb", border: "2px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <BsFillCameraFill style={{ fontSize: 36, color: "#d1d5db" }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontWeight: 700, color: "#374151", margin: 0, fontSize: 15 }}>
                                    {faceStatusLoading ? "Checking face status..." : "Ready to capture"}
                                </p>
                                <p style={{ color: "#9ca3af", fontSize: 13, margin: "5px 0 0" }}>
                                    {empLoading ? (!token ? "Waiting for authentication..." : "Loading employees...") : faceStatusLoading ? "Please wait..." : "Select an employee, then open the camera"}
                                </p>
                            </div>
                            <button onClick={handleOpenCamera} disabled={!selectedId || empLoading || faceStatusLoading} style={S.btnPrimary(!selectedId || empLoading || faceStatusLoading)}>
                                <BsFillCameraFill /> Open Camera
                            </button>
                        </div>
                    )}

                    {/* CAMERA */}
                    {mode === "camera" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                            <div className="fid-camera-wrap">
                                {cam.camError ? (
                                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#f87171", padding: 20, textAlign: "center" }}>
                                        <MdError style={{ fontSize: 44 }} /> <p style={{ fontSize: 13 }}>{cam.camError}</p>
                                    </div>
                                ) : (
                                    <>
                                        <video ref={cam.videoRef} autoPlay muted playsInline />
                                        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "42%", maxWidth: 170, aspectRatio: "0.85", borderRadius: "50%", border: "2px solid #FF5800", boxShadow: "0 0 24px rgba(255,88,0,0.4)" }} />
                                            <div className="face-scan-line" />
                                            {[{ top: 8, left: 8, borderTop: "2px solid #FF5800", borderLeft: "2px solid #FF5800", borderRadius: "4px 0 0 0" }, { top: 8, right: 8, borderTop: "2px solid #FF5800", borderRight: "2px solid #FF5800", borderRadius: "0 4px 0 0" }, { bottom: 8, left: 8, borderBottom: "2px solid #FF5800", borderLeft: "2px solid #FF5800", borderRadius: "0 0 0 4px" }, { bottom: 8, right: 8, borderBottom: "2px solid #FF5800", borderRight: "2px solid #FF5800", borderRadius: "0 0 4px 0" }].map((s, i) => (
                                                <div key={i} style={{ position: "absolute", width: 18, height: 18, ...s }} />
                                            ))}
                                            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.65)", borderRadius: 20, padding: "5px 14px", fontSize: 11, color: "#FF5800", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF5800", display: "inline-block" }} />
                                                LIVE · Position face in oval
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <canvas ref={cam.canvasRef} style={{ display: "none" }} />
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={handleCapture} disabled={!!cam.camError} style={{ ...S.btnPrimary(!!cam.camError), flex: 1 }}>📸 Capture Face</button>
                                <button onClick={handleReset} style={S.btnOutline}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* PREVIEW */}
                    {mode === "preview" && previewUrl && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                            <div className="fid-camera-wrap" style={{ border: "2px solid #FF5800" }}>
                                <img src={previewUrl} alt="Captured" />
                                <div style={{ position: "absolute", top: 10, left: 10, background: "#FF5800", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>Captured ✓</div>
                            </div>
                            {selectedEmp && (
                                <div style={{ borderRadius: 10, background: "#f4f6fb", border: "1px solid #e5e7eb", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                                    <FiUser style={{ color: "#FF5800", fontSize: 20, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: "#9ca3af", fontSize: 11, margin: 0 }}>Registering for</p>
                                        <p style={{ fontWeight: 700, color: "#1f2937", fontSize: 13, margin: "2px 0 0" }}>{selectedEmp.name}</p>
                                        <p style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>{selectedEmp.id} · {selectedEmp.dept}</p>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: 20 }}>Ready</span>
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={handleUpload} style={{ ...S.btnPrimary(false), flex: 1 }}>
                                    <MdOutlineCloudUpload style={{ fontSize: 18 }} /> Store to System
                                </button>
                                <button onClick={handleRetake} style={S.btnOutline}><MdRefresh /> Retake</button>
                            </div>
                        </div>
                    )}

                    {/* UPLOADING */}
                    {mode === "uploading" && (
                        <div style={S.center}>
                            {previewUrl && (
                                <div style={{ position: "relative", width: 100, height: 100 }}>
                                    <img src={previewUrl} alt="Uploading" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "3px solid #FF5800" }} />
                                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#FF5800", animation: "faceSpinner 0.8s linear infinite", opacity: 0.5 }} />
                                </div>
                            )}
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontWeight: 700, color: "#374151", margin: 0 }}>Storing face data...</p>
                                <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>Sending to server</p>
                            </div>
                            <div style={{ width: "100%", maxWidth: 260 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 5 }}>
                                    <span>Uploading</span>
                                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#FF5800" }}>{uploadProgress}%</span>
                                </div>
                                <div style={{ height: 7, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", background: "#FF5800", borderRadius: 4, width: `${uploadProgress}%`, transition: "width 0.3s" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {mode === "success" && (
                        <div style={{ ...S.center, gap: 16 }}>
                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MdCheckCircle style={{ fontSize: 44, color: "#22c55e" }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", margin: 0 }}>Face Stored!</p>
                                <p style={{ color: "#6b7280", fontSize: 13, margin: "5px 0 0" }}>Profile image uploaded successfully</p>
                            </div>
                            {selectedEmp && (
                                <div style={{ borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 360 }}>
                                    <div style={S.avatar}>{selectedEmp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, color: "#1f2937", fontSize: 13, margin: 0 }}>{selectedEmp.name}</p>
                                        <p style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>{selectedEmp.id} · {selectedEmp.dept}</p>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 12px", borderRadius: 20, border: "1px solid #bbf7d0" }}>Enrolled ✓</span>
                                </div>
                            )}
                            {/* Show image_url from API response if available */}
                            {resultData?.image_url && (
                                <div style={{ borderRadius: 10, background: "#f9fafb", border: "1px solid #e5e7eb", padding: "10px 14px", width: "100%", maxWidth: 360 }}>
                                    <p style={{ color: "#9ca3af", fontSize: 11, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Stored at</p>
                                    <p style={{ color: "#6b7280", fontSize: 11, fontFamily: "monospace", margin: 0, wordBreak: "break-all" }}>{resultData.profile_path}</p>
                                </div>
                            )}
                            <button onClick={handleReset} style={S.btnPrimary(false)}>+ Register Another Employee</button>
                        </div>
                    )}

                    {/* ERROR */}
                    {mode === "error" && (
                        <div style={{ ...S.center, gap: 16 }}>
                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MdError style={{ fontSize: 44, color: "#f87171" }} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", margin: 0 }}>Upload Failed</p>
                                <p style={{ color: "#ef4444", fontSize: 13, margin: "5px 0 0" }}>{errorMsg}</p>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={handleUpload} style={S.btnPrimary(false)}><MdRefresh /> Retry</button>
                                <button onClick={handleReset} style={S.btnOutline}>Start Over</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
    card: { background: "white", borderRadius: 14, border: "1px solid #f0f0f0", padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
    select: { width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#374151", background: "#f9fafb", outline: "none", cursor: "pointer" },
    avatar: { width: 38, height: 38, borderRadius: "50%", background: "#18234b", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 },
    center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "30px 0" },
    btnPrimary: (disabled) => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", borderRadius: 11, fontWeight: 700, fontSize: 14, color: "white", background: disabled ? "#fca97a" : "#FF5800", border: "none", cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : "0 4px 12px rgba(255,88,0,0.25)" }),
    btnOutline: { padding: "12px 20px", borderRadius: 11, fontWeight: 700, fontSize: 14, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
};

function SectionTitle({ children, noMargin }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: noMargin ? 0 : 12 }}>
            <span style={{ width: 3, height: 15, background: "#FF5800", borderRadius: 2, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>{children}</span>
        </div>
    );
}