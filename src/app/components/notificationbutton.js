// notificationbutton
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FaBell } from "react-icons/fa"

export default function NotificationButton() {
  const [inquiryCount, setInquiryCount] = useState(0)
  const router = useRouter()

  // 문의 수 조회
  useEffect(() => {
    const fetchInquiryCount = async () => {
      try {
        const response = await fetch("/api/inquiry-route")
        if (response.ok) {
          const data = await response.json()
          console.log("API 응답 데이터:", data)
          console.log("문의 목록:", data.inquiries)

          // 첫 번째 문의의 구조 확인
          if (data.inquiries && data.inquiries.length > 0) {
            console.log("첫 번째 문의 구조:", data.inquiries[0])
            console.log(
              "첫 번째 문의의 모든 키:",
              Object.keys(data.inquiries[0])
            )
          }

          const pendingInquiries =
            data.inquiries?.filter((inquiry) => inquiry.Status === "pending") ||
            []
          console.log("Pending 문의:", pendingInquiries)
          console.log("Pending 개수:", pendingInquiries.length)
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
      {/* 임시 테스트용 - 항상 표시 */}
      <span
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          background: "#ff4444",
          color: "white",
          borderRadius: "50%",
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold",
          border: "2px solid #fff",
          zIndex: 1000,
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {inquiryCount}
      </span>
      {inquiryCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            background: "#ff4444",
            color: "white",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            border: "2px solid #fff",
            zIndex: 1000,
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {inquiryCount > 99 ? "99+" : inquiryCount}
        </span>
      )}
    </button>
  )
}
