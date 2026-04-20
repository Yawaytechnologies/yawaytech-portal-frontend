// src/pages/AdminFaceRegister.jsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { BsFillCameraFill } from "react-icons/bs";
import {
  MdOutlineCloudUpload,
  MdCheckCircle,
  MdError,
  MdRefresh,
} from "react-icons/md";
import { FiUser } from "react-icons/fi";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://yawaytech-portal-backend-python-2.onrender.com"
).replace(/\/$/, "");

const FIELD_NAME = "file";
const DEPARTMENTS = ["HR", "IT", "Marketing", "Finance", "Sales"];

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
      }).then((res) => {
        if (!res.ok) throw new Error(`${dept}: ${res.status}`);
        return res.json();
      }),
    ),
  ).then((results) => {
    const all = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const data = Array.isArray(result.value) ? result.value : [];

        data.forEach((emp) => {
          all.push({
            id: emp.employee_id || emp.employeeId || emp.id || "",
            name:
              emp.name ||
              emp.employee_name ||
              emp.full_name ||
              emp.fullName ||
              "Unknown",
            dept: DEPARTMENTS[index],
            role: emp.designation || emp.role || "",
          });
        });
      }
    });

    const seen = new Set();

    const unique = all.filter((emp) => {
      if (!emp.id || seen.has(emp.id)) return false;
      seen.add(emp.id);
      return true;
    });

    _cachedEmployees = unique;
    _fetchPromise = null;

    return unique;
  });

  return _fetchPromise;
}

function showSuccessToast(message) {
  const toast = document.createElement("div");

  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    z-index: 9999;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

async function getErrorMessage(res) {
  const err = await res.json().catch(() => ({}));

  if (typeof err?.detail === "string") return err.detail;

  if (Array.isArray(err?.detail)) {
    return err.detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join(", ");
  }

  if (err?.message) return err.message;

  return `Server error ${res.status}`;
}

async function apiCheckFaceStatus(employeeId, token) {
  const res = await fetch(
    `${BASE_URL}/api/employee-profiles/${encodeURIComponent(employeeId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  const data = await res.json();

  return {
    face_registered: !!(
      data.profile_path ||
      data.image_url ||
      data.profile_image ||
      data.profileImage
    ),
    data,
  };
}

async function apiStoreFace(employeeId, imageBlob, token) {
  const form = new FormData();
  form.append(FIELD_NAME, imageBlob, "face.jpg");

  const res = await fetch(
    `${BASE_URL}/api/employee-profiles/${encodeURIComponent(
      employeeId,
    )}/profile-image`,
    {
      method: "POST",
      body: form,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json().catch(() => ({}));
}

function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camError, setCamError] = useState(null);

  const startCamera = useCallback(async () => {
    setCamError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
      setCamError("Camera access denied. Please allow camera permission.");
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

  const captureBlob = useCallback(() => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return resolve(null);

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, width, height);

      // mirror correction: same as camera preview
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -width, 0, width, height);
      ctx.restore();

      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    camError,
    startCamera,
    stopCamera,
    captureBlob,
  };
}

export default function AdminFaceRegister() {
  const cam = useCamera();

  const token = useSelector(
    (state) => state.auth?.token || state.auth?.user?.token || null,
  );

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
  const [statusCheckDone, setStatusCheckDone] = useState(false);

  const [isUpdatingExistingFace, setIsUpdatingExistingFace] = useState(false);
  const [lastActionWasUpdate, setLastActionWasUpdate] = useState(false);

  const selectedEmp = employees.find((emp) => emp.id === selectedId);

  useEffect(() => {
    if (_cachedEmployees !== null) {
      setEmployees(_cachedEmployees);
      setEmpLoading(false);
      return;
    }

    if (!token) return;

    let active = true;

    setEmpLoading(true);
    setEmpError(null);

    fetchAllEmployees(token)
      .then((list) => {
        if (!active) return;
        setEmployees(list);
        setEmpLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setEmpError(err.message || "Failed to load employees");
        setEmpLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedId) {
      setFaceRegistered(false);
      setStatusCheckDone(false);
      return;
    }

    let active = true;

    setFaceStatusLoading(true);
    setStatusCheckDone(false);
    setFaceRegistered(false);

    apiCheckFaceStatus(selectedId, token)
      .then((res) => {
        if (!active) return;

        setFaceRegistered(!!res.face_registered);
        setStatusCheckDone(true);
        setFaceStatusLoading(false);
      })
      .catch((err) => {
        if (!active) return;

        console.warn("Face status check failed:", err.message);
        setFaceRegistered(false);
        setStatusCheckDone(true);
        setFaceStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId, token]);

  useEffect(() => {
    if (selectedId && statusCheckDone && !faceRegistered && mode === "idle") {
      setMode("camera");
      cam.startCamera();
    }
  }, [selectedId, statusCheckDone, faceRegistered, mode, cam.startCamera]);

  const safeRevokeUrl = useCallback((url) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const resetCaptureOnly = () => {
    cam.stopCamera();
    safeRevokeUrl(previewUrl);
    setPreviewUrl(null);
    setCapturedBlob(null);
    setResultData(null);
    setErrorMsg("");
    setUploadProgress(0);
  };

  const handleSelectEmployee = (value) => {
    resetCaptureOnly();

    setMode("idle");
    setSelectedId(value);
    setFaceRegistered(false);
    setStatusCheckDone(false);
    setFaceStatusLoading(false);
    setIsUpdatingExistingFace(false);
    setLastActionWasUpdate(false);
  };

  const handleOpenCamera = async () => {
    setMode("camera");
    await cam.startCamera();
  };

  const handleChangeRegisteredFace = async () => {
    resetCaptureOnly();

    setIsUpdatingExistingFace(true);
    setLastActionWasUpdate(false);
    setMode("camera");

    await cam.startCamera();
  };

  const handleCapture = async () => {
    const blob = await cam.captureBlob();

    if (!blob) {
      setErrorMsg("Capture failed. Please try again.");
      setMode("error");
      return;
    }

    cam.stopCamera();

    safeRevokeUrl(previewUrl);

    setCapturedBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setMode("preview");
  };

  const handleRetake = () => {
    safeRevokeUrl(previewUrl);

    setPreviewUrl(null);
    setCapturedBlob(null);
    setMode("camera");

    cam.startCamera();
  };

  const handleGoBack = () => {
    resetCaptureOnly();

    setMode("idle");
    setSelectedId("");
    setFaceRegistered(false);
    setStatusCheckDone(false);
    setFaceStatusLoading(false);
    setIsUpdatingExistingFace(false);
    setLastActionWasUpdate(false);
  };

  const handleUpload = async () => {
    if (!selectedId || !capturedBlob) return;

    const wasUpdate = faceRegistered || isUpdatingExistingFace;

    setMode("uploading");
    setErrorMsg("");

    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 20;

      if (progress > 85) {
        progress = 85;
        clearInterval(interval);
      }

      setUploadProgress(Math.round(progress));
    }, 150);

    try {
      const res = await apiStoreFace(selectedId, capturedBlob, token);

      clearInterval(interval);
      setUploadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 300));

      showSuccessToast(
        wasUpdate
          ? "Face updated successfully"
          : "Face registered successfully",
      );

      setLastActionWasUpdate(wasUpdate);
      setFaceRegistered(true);
      setIsUpdatingExistingFace(false);
      setResultData(res);
      setMode("success");
    } catch (err) {
      clearInterval(interval);

      setErrorMsg(err.message || "Upload failed. Please try again.");
      setMode("error");
    }
  };

  const handleReset = () => {
    resetCaptureOnly();

    setSelectedId("");
    setMode("idle");
    setFaceRegistered(false);
    setStatusCheckDone(false);
    setFaceStatusLoading(false);
    setIsUpdatingExistingFace(false);
    setLastActionWasUpdate(false);
  };

  const handleRefreshEmployees = () => {
    _cachedEmployees = null;
    _fetchPromise = null;

    setEmpLoading(true);
    setEmpError(null);

    fetchAllEmployees(token)
      .then((list) => {
        setEmployees(list);
        setEmpLoading(false);
      })
      .catch((err) => {
        setEmpError(err.message || "Failed to load employees");
        setEmpLoading(false);
      });
  };

  return (
    <div style={{ background: "#f4f6fb", minHeight: "100%" }}>
      <style>{`
        @keyframes faceSpinner {
          to { transform: rotate(360deg); }
        }

        .fid-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .fid-grid {
            grid-template-columns: 1fr;
          }

          .fid-action-row {
            flex-direction: column;
          }
        }

        .fid-camera-wrap {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #000;
          width: 100%;
          aspect-ratio: 16 / 9;
          min-height: 360px;
        }

        .fid-camera-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scaleX(-1);
        }

        .fid-camera-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (max-width: 768px) {
          .fid-camera-wrap {
            min-height: 260px;
            aspect-ratio: 4 / 3;
          }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1f2937",
            margin: 0,
          }}
        >
          Face ID · <span style={{ color: "#FF5800" }}>Register Employee</span>
        </h1>

        <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>
          Capture, register, and update employee face images for attendance
          verification
        </p>
      </div>

      <div
        style={{
          marginBottom: 20,
          borderRadius: 12,
          border: "1px solid #fed7aa",
          background: "#fff7ed",
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <BsFillCameraFill
          style={{
            color: "#FF5800",
            fontSize: 18,
            marginTop: 2,
            flexShrink: 0,
          }}
        />

        <div>
          <p
            style={{
              color: "#FF5800",
              fontWeight: 700,
              fontSize: 14,
              margin: 0,
            }}
          >
            Admin: Face Image Registration
          </p>

          <p style={{ color: "#6b7280", fontSize: 12, margin: "3px 0 0" }}>
            Camera is full-frame now. No face circle. Capture clear front-facing
            image.
          </p>
        </div>
      </div>

      <div className="fid-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <SectionTitle noMargin>Select Employee</SectionTitle>

              {!empLoading && (
                <button
                  onClick={handleRefreshEmployees}
                  title="Refresh employee list"
                  style={S.iconButton}
                >
                  <MdRefresh />
                </button>
              )}
            </div>

            {empLoading && (
              <div style={S.loadingRow}>
                <div style={S.spinner} />
                {!token ? "Waiting for auth..." : "Loading employees..."}
              </div>
            )}

            {empError && !empLoading && (
              <div style={S.errorSmall}>
                <span>⚠️ {empError}</span>

                <button onClick={handleRefreshEmployees} style={S.retryButton}>
                  Retry
                </button>
              </div>
            )}

            {!empLoading && (
              <select
                value={selectedId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                disabled={["uploading", "success"].includes(mode)}
                style={S.select}
              >
                <option value="">
                  {employees.length === 0
                    ? "No employees found"
                    : "-- Choose employee --"}
                </option>

                {DEPARTMENTS.map((dept) => {
                  const list = employees.filter((emp) => emp.dept === dept);

                  if (!list.length) return null;

                  return (
                    <optgroup key={dept} label={`── ${dept} (${list.length})`}>
                      {list.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} · {emp.id}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}

            {selectedEmp && (
              <div style={S.selectedEmployeeBox}>
                <div style={S.avatar}>
                  {selectedEmp.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <p style={S.selectedName}>{selectedEmp.name}</p>
                  <p style={S.selectedRole}>
                    {selectedEmp.role || selectedEmp.dept}
                  </p>
                  <p style={S.selectedId}>{selectedEmp.id}</p>
                </div>
              </div>
            )}

            {!empLoading && employees.length > 0 && (
              <p style={S.countText}>✓ {employees.length} employees loaded</p>
            )}
          </div>

          <div style={S.card}>
            <SectionTitle>Steps</SectionTitle>

            <ol style={S.stepsList}>
              {[
                {
                  n: 1,
                  label: "Select employee",
                  done: !!selectedId,
                  active: !selectedId,
                },
                {
                  n: 2,
                  label:
                    faceRegistered || isUpdatingExistingFace
                      ? "Change registered face"
                      : "Open camera",
                  done: ["preview", "uploading", "success", "error"].includes(
                    mode,
                  ),
                  active: mode === "idle" && !!selectedId,
                },
                {
                  n: 3,
                  label: "Capture full image",
                  done: ["preview", "uploading", "success"].includes(mode),
                  active: mode === "camera",
                },
                {
                  n: 4,
                  label:
                    faceRegistered || isUpdatingExistingFace
                      ? "Update to system"
                      : "Store to system",
                  done: mode === "success",
                  active: mode === "preview",
                },
              ].map(({ n, label, done, active }) => (
                <li
                  key={n}
                  style={{
                    ...S.stepItem,
                    borderColor: done
                      ? "#bbf7d0"
                      : active
                        ? "#fed7aa"
                        : "#f3f4f6",
                    background: done
                      ? "#f0fdf4"
                      : active
                        ? "#fff7ed"
                        : "#f9fafb",
                    color: done ? "#15803d" : active ? "#FF5800" : "#9ca3af",
                  }}
                >
                  <span
                    style={{
                      ...S.stepCircle,
                      background: done
                        ? "#22c55e"
                        : active
                          ? "#FF5800"
                          : "#e5e7eb",
                      color: done || active ? "white" : "#9ca3af",
                    }}
                  >
                    {done ? "✓" : n}
                  </span>

                  {label}
                </li>
              ))}
            </ol>
          </div>

          <div style={S.card}>
            <SectionTitle>Capture Tips</SectionTitle>

            <ul style={S.tipsList}>
              {[
                ["💡", "Good lighting, no backlight"],
                ["😐", "Face clearly visible"],
                ["📷", "Keep face near center"],
                ["🚫", "No sunglasses or mask"],
                ["📏", "Keep camera stable"],
              ].map(([icon, tip]) => (
                <li key={tip} style={S.tipItem}>
                  <span>{icon}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            ...S.card,
            display: "flex",
            flexDirection: "column",
            minHeight: 520,
            padding: 20,
          }}
        >
          {mode === "idle" &&
            selectedId &&
            !empLoading &&
            faceRegistered &&
            !faceStatusLoading && (
              <div style={S.center}>
                <div style={S.successIconWrap}>
                  <MdCheckCircle style={{ fontSize: 48, color: "#22c55e" }} />
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={S.registeredBadge}>✓ Face Already Registered</div>

                  <p style={S.panelTitle}>Face has been registered</p>

                  <p style={S.panelText}>
                    This employee already has a registered face image. Click
                    Change Registered Face to update it.
                  </p>
                </div>

                <div style={S.actionRowFull}>
                  <button
                    onClick={handleChangeRegisteredFace}
                    style={{
                      ...S.btnPrimary(false),
                      flex: 1,
                      background: "#FF5800",
                      color: "white",
                      border: "2px solid #FF5800",
                    }}
                  >
                    Change Registered Face
                  </button>

                  <button
                    onClick={handleGoBack}
                    style={{
                      ...S.btnOutline,
                      flex: 1,
                      color: "#1f2937",
                      borderColor: "#d1d5db",
                    }}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}

          {mode === "idle" &&
            (!selectedId || !faceRegistered || faceStatusLoading) && (
              <div style={S.center}>
                <div style={S.cameraIdleIcon}>
                  <BsFillCameraFill
                    style={{ fontSize: 36, color: "#d1d5db" }}
                  />
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={S.panelTitle}>
                    {faceStatusLoading
                      ? "Checking face status..."
                      : "Ready to capture"}
                  </p>

                  <p style={S.panelText}>
                    {empLoading
                      ? !token
                        ? "Waiting for authentication..."
                        : "Loading employees..."
                      : faceStatusLoading
                        ? "Please wait..."
                        : "Select an employee, then open the camera"}
                  </p>
                </div>

                <button
                  onClick={handleOpenCamera}
                  disabled={!selectedId || empLoading || faceStatusLoading}
                  style={S.btnPrimary(
                    !selectedId || empLoading || faceStatusLoading,
                  )}
                >
                  <BsFillCameraFill /> Open Camera
                </button>
              </div>
            )}

          {mode === "camera" && (
            <div style={S.cameraMode}>
              <div className="fid-camera-wrap">
                {cam.camError ? (
                  <div style={S.cameraError}>
                    <MdError style={{ fontSize: 44 }} />
                    <p style={{ fontSize: 13 }}>{cam.camError}</p>
                  </div>
                ) : (
                  <>
                    <video ref={cam.videoRef} autoPlay muted playsInline />

                    <div style={S.cameraOverlay}>
                      <div style={S.topCameraBadge}>
                        Camera Active · Full Frame Capture
                      </div>

                      <div style={S.bottomCameraHint}>
                        Keep face clear and centered
                      </div>
                    </div>
                  </>
                )}
              </div>

              <canvas ref={cam.canvasRef} style={{ display: "none" }} />

              <div className="fid-action-row" style={S.actionRow}>
                <button
                  onClick={handleCapture}
                  disabled={!!cam.camError}
                  style={{ ...S.btnPrimary(!!cam.camError), flex: 1 }}
                >
                  📸 Capture Image
                </button>

                <button onClick={handleReset} style={S.btnOutline}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === "preview" && previewUrl && (
            <div style={S.cameraMode}>
              <div
                className="fid-camera-wrap"
                style={{ border: "2px solid #FF5800" }}
              >
                <img src={previewUrl} alt="Captured" />

                <div style={S.capturedBadge}>Captured ✓</div>
              </div>

              {selectedEmp && (
                <div style={S.previewEmployeeBox}>
                  <FiUser
                    style={{
                      color: "#FF5800",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <p style={S.previewLabel}>
                      {faceRegistered || isUpdatingExistingFace
                        ? "Updating for"
                        : "Registering for"}
                    </p>

                    <p style={S.previewName}>{selectedEmp.name}</p>

                    <p style={S.previewId}>
                      {selectedEmp.id} · {selectedEmp.dept}
                    </p>
                  </div>

                  <span style={S.readyBadge}>Ready</span>
                </div>
              )}

              <div className="fid-action-row" style={S.actionRow}>
                <button
                  onClick={handleUpload}
                  style={{ ...S.btnPrimary(false), flex: 1 }}
                >
                  <MdOutlineCloudUpload style={{ fontSize: 18 }} />
                  {faceRegistered || isUpdatingExistingFace
                    ? "Update Face"
                    : "Store to System"}
                </button>

                <button onClick={handleRetake} style={S.btnOutline}>
                  <MdRefresh /> Retake
                </button>
              </div>
            </div>
          )}

          {mode === "uploading" && (
            <div style={S.center}>
              {previewUrl && (
                <div style={S.uploadImageWrap}>
                  <img src={previewUrl} alt="Uploading" style={S.uploadImage} />
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <p style={S.panelTitle}>
                  {faceRegistered || isUpdatingExistingFace
                    ? "Updating face data..."
                    : "Storing face data..."}
                </p>

                <p style={S.panelText}>Sending to server</p>
              </div>

              <div style={S.progressWrap}>
                <div style={S.progressTop}>
                  <span>
                    {faceRegistered || isUpdatingExistingFace
                      ? "Updating"
                      : "Uploading"}
                  </span>

                  <span style={S.progressPercent}>{uploadProgress}%</span>
                </div>

                <div style={S.progressTrack}>
                  <div
                    style={{
                      ...S.progressFill,
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {mode === "success" && (
            <div style={{ ...S.center, gap: 16 }}>
              <div style={S.successIconWrap}>
                <MdCheckCircle style={{ fontSize: 44, color: "#22c55e" }} />
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={S.successTitle}>
                  {lastActionWasUpdate ? "Face Updated!" : "Face Stored!"}
                </p>

                <p style={S.panelText}>
                  {lastActionWasUpdate
                    ? "Registered face image updated successfully"
                    : "Profile image uploaded successfully"}
                </p>
              </div>

              {selectedEmp && (
                <div style={S.successEmployeeBox}>
                  <div style={S.avatar}>
                    {selectedEmp.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={S.selectedName}>{selectedEmp.name}</p>

                    <p style={S.previewId}>
                      {selectedEmp.id} · {selectedEmp.dept}
                    </p>
                  </div>

                  <span style={S.enrolledBadge}>
                    {lastActionWasUpdate ? "Updated ✓" : "Enrolled ✓"}
                  </span>
                </div>
              )}

              {(resultData?.image_url || resultData?.profile_path) && (
                <div style={S.storedPathBox}>
                  <p style={S.storedPathLabel}>Stored at</p>

                  <p style={S.storedPathText}>
                    {resultData.profile_path || resultData.image_url}
                  </p>
                </div>
              )}

              <div style={S.actionRowFull}>
                <button onClick={handleReset} style={S.btnPrimary(false)}>
                  + Register Another Employee
                </button>

                <button
                  onClick={handleChangeRegisteredFace}
                  style={{
                    ...S.btnOutline,
                    color: "#FF5800",
                    borderColor: "#FF5800",
                  }}
                >
                  Change Again
                </button>
              </div>
            </div>
          )}

          {mode === "error" && (
            <div style={{ ...S.center, gap: 16 }}>
              <div style={S.errorIconWrap}>
                <MdError style={{ fontSize: 44, color: "#f87171" }} />
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={S.successTitle}>Upload Failed</p>
                <p style={{ ...S.panelText, color: "#ef4444" }}>{errorMsg}</p>
              </div>

              <div style={S.actionRow}>
                <button onClick={handleUpload} style={S.btnPrimary(false)}>
                  <MdRefresh /> Retry
                </button>

                <button onClick={handleReset} style={S.btnOutline}>
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  card: {
    background: "white",
    borderRadius: 14,
    border: "1px solid #f0f0f0",
    padding: 18,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  select: {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    color: "#374151",
    background: "#f9fafb",
    outline: "none",
    cursor: "pointer",
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: 16,
    padding: 2,
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 0",
    color: "#9ca3af",
    fontSize: 13,
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid #fed7aa",
    borderTopColor: "#FF5800",
    borderRadius: "50%",
    animation: "faceSpinner 0.8s linear infinite",
    flexShrink: 0,
  },
  errorSmall: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    color: "#ef4444",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  retryButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#ef4444",
    fontSize: 11,
    fontWeight: 700,
    padding: 0,
    whiteSpace: "nowrap",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "#18234b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  selectedEmployeeBox: {
    marginTop: 10,
    borderRadius: 10,
    background: "#f4f6fb",
    border: "1px solid #e5e7eb",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  selectedName: {
    fontWeight: 700,
    color: "#1f2937",
    fontSize: 13,
    margin: 0,
  },
  selectedRole: {
    color: "#9ca3af",
    fontSize: 11,
    margin: "2px 0 0",
  },
  selectedId: {
    color: "#FF5800",
    fontSize: 11,
    fontFamily: "monospace",
    margin: "2px 0 0",
  },
  countText: {
    color: "#9ca3af",
    fontSize: 11,
    margin: "8px 0 0",
    textAlign: "right",
  },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: "30px 0",
  },
  btnPrimary: (disabled) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 24px",
    borderRadius: 11,
    fontWeight: 700,
    fontSize: 14,
    color: "white",
    background: disabled ? "#fca97a" : "#FF5800",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 4px 12px rgba(255,88,0,0.25)",
  }),
  btnOutline: {
    padding: "12px 20px",
    borderRadius: 11,
    fontWeight: 700,
    fontSize: 14,
    color: "#6b7280",
    background: "white",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  stepsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 11px",
    borderRadius: 10,
    fontSize: 13,
    border: "1px solid",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
  },
  tipsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  tipItem: {
    display: "flex",
    gap: 8,
    fontSize: 12,
    color: "#6b7280",
    alignItems: "center",
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    background: "#f0fdf4",
    border: "2px solid #bbf7d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  registeredBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#22c55e",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: 10,
    marginBottom: 12,
  },
  panelTitle: {
    fontWeight: 700,
    color: "#374151",
    margin: 0,
    fontSize: 15,
  },
  panelText: {
    color: "#6b7280",
    fontSize: 13,
    margin: "8px 0 0",
    lineHeight: 1.5,
  },
  actionRowFull: {
    display: "flex",
    gap: 10,
    width: "100%",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  cameraIdleIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    background: "#f4f6fb",
    border: "2px dashed #d1d5db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraMode: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cameraError: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#f87171",
    padding: 20,
    textAlign: "center",
  },
  cameraOverlay: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  topCameraBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "rgba(0,0,0,0.65)",
    color: "#ffffff",
    padding: "6px 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
  },
  bottomCameraHint: {
    position: "absolute",
    bottom: 12,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.7)",
    color: "#FF5800",
    padding: "7px 16px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  actionRow: {
    display: "flex",
    gap: 10,
  },
  capturedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "#FF5800",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 12px",
    borderRadius: 10,
  },
  previewEmployeeBox: {
    borderRadius: 10,
    background: "#f4f6fb",
    border: "1px solid #e5e7eb",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  previewLabel: {
    color: "#9ca3af",
    fontSize: 11,
    margin: 0,
  },
  previewName: {
    fontWeight: 700,
    color: "#1f2937",
    fontSize: 13,
    margin: "2px 0 0",
  },
  previewId: {
    color: "#9ca3af",
    fontSize: 11,
    fontFamily: "monospace",
    margin: "2px 0 0",
  },
  readyBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#16a34a",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "4px 12px",
    borderRadius: 10,
  },
  uploadImageWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
    aspectRatio: "16 / 9",
    borderRadius: 14,
    overflow: "hidden",
    border: "2px solid #FF5800",
  },
  uploadImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  progressWrap: {
    width: "100%",
    maxWidth: 260,
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  progressPercent: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "#FF5800",
  },
  progressTrack: {
    height: 7,
    background: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#FF5800",
    borderRadius: 4,
    transition: "width 0.3s",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1f2937",
    margin: 0,
  },
  successEmployeeBox: {
    borderRadius: 12,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 360,
  },
  enrolledBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#16a34a",
    background: "#dcfce7",
    padding: "3px 12px",
    borderRadius: 10,
    border: "1px solid #bbf7d0",
  },
  storedPathBox: {
    borderRadius: 10,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: "10px 14px",
    width: "100%",
    maxWidth: 360,
  },
  storedPathLabel: {
    color: "#9ca3af",
    fontSize: 11,
    margin: "0 0 4px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  storedPathText: {
    color: "#6b7280",
    fontSize: 11,
    fontFamily: "monospace",
    margin: 0,
    wordBreak: "break-all",
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    background: "#fef2f2",
    border: "2px solid #fecaca",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

function SectionTitle({ children, noMargin }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: noMargin ? 0 : 12,
      }}
    >
      <span
        style={{
          width: 3,
          height: 15,
          background: "#FF5800",
          borderRadius: 2,
          display: "inline-block",
        }}
      />

      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {children}
      </span>
    </div>
  );
}
