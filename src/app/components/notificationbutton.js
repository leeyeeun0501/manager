// notificationbutton
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FaBell } from "react-icons/fa"

export default function NotificationButton() {
  const [inquiryCount, setInquiryCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchInquiryCount = async () => {
      try {
        const response = await fetch("/api/inquiry-route")
        if (response.ok) {
          const data = await response.json()
          const pendingInquiries =
            data.inquiries?.filter((inquiry) => inquiry.status === "대기중") ||
            []
          setInquiryCount(pendingInquiries.length)
        }
      } catch (error) {
        console.error("문의 수 조회 오류:", error)
      }
    }

    fetchInquiryCount()

    // 30초마다 문의 수 업데이트
    const interval = setInterval(fetchInquiryCount, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => router.push("/inquiry")}
      aria-label="문의 관리로 이동"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        borderRadius: "50%",
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "none",
        transition: "box-shadow 0.2s",
        position: "relative",
      }}
    >
      <FaBell size={20} color="#555" />
      {inquiryCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            background: "#ff4444",
            color: "white",
            borderRadius: "50%",
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: "700",
            border: "2px solid #fff",
            animation: "pulse 2s infinite",
          }}
        >
          {inquiryCount > 99 ? "99+" : inquiryCount}
        </span>
      )}
    </button>
  )
}
