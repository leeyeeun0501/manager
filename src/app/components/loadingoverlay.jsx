// LoadingOverlay
import React from "react"

export default function LoadingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="spinner"></div>
      <style>{`
        .spinner {
          width: 80px;
          height: 80px;
          border: 8px solid rgba(255,255,255,0.3);
          border-top: 8px solid #0070f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
