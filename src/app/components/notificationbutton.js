// notificationbutton
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FaBell } from "react-icons/fa"
import { apiGet, parseJsonResponse } from "../utils/apiHelper"

export default function NotificationButton() {
  const [inquiryCount, setInquiryCount] = useState(0)
  const router = useRouter()

  // 문의 수 조회
  useEffect(() => {
    const fetchInquiryCount = async () => {
      try {
        const data = await apiGet("/api/inquiry-route")
        const responseData = await parseJsonResponse(data)
        
        // data.data 구조로 변경 - 이중 중첩 구조 처리
        let inquiries = []
        if (responseData.inquiries && Array.isArray(responseData.inquiries)) {
          inquiries = responseData.inquiries
        } else if (responseData.data?.data?.inquiries && Array.isArray(responseData.data.data.inquiries)) {
          inquiries = responseData.data.data.inquiries
        } else if (responseData.data?.inquiries && Array.isArray(responseData.data.inquiries)) {
          inquiries = responseData.data.inquiries
        } else if (responseData.data && Array.isArray(responseData.data)) {
          inquiries = responseData.data
        } else if (Array.isArray(responseData)) {
          inquiries = responseData
        }

        const pendingInquiries = inquiries.filter((inquiry) => inquiry.Status === "pending")
        setInquiryCount(pendingInquiries.length)
      } catch (error) {
        // 에러가 발생해도 카운트는 0으로 설정
        setInquiryCount(0)
      }
    }

    fetchInquiryCount()

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
