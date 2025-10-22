// 문의 알림
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FaBell } from "react-icons/fa"
import { apiGet, parseJsonResponse } from "../utils/apiHelper"

const INQUIRY_FETCH_INTERVAL = 30000; // 30초

export default function NotificationButton() {
  const [inquiryCount, setInquiryCount] = useState(0)
  const router = useRouter()

  // 문의 수 조회
  useEffect(() => {
    const fetchInquiryCount = async () => {
      try {
        const data = await apiGet("/api/inquiry-route")
        const responseData = await parseJsonResponse(data)

        // 다양한 API 응답 구조를 간결하게 처리
        const inquiries =
          responseData?.inquiries ||
          responseData?.data?.data?.inquiries ||
          responseData?.data?.inquiries ||
          responseData?.data ||
          responseData ||
          [];

        const pendingInquiries = Array.isArray(inquiries) ? inquiries.filter((inquiry) => inquiry.Status === "pending") : [];
        setInquiryCount(pendingInquiries.length)
      } catch (error) {
        console.error("Failed to fetch inquiry count:", error);
        setInquiryCount(0)
      }
    }

    fetchInquiryCount()
    const interval = setInterval(fetchInquiryCount, INQUIRY_FETCH_INTERVAL)

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
