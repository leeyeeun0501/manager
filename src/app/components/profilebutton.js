"use client"
import { useRouter } from "next/navigation"
import { FaUserCircle } from "react-icons/fa"

export default function ProfileButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push("/mypage")}
      aria-label="마이페이지로 이동"
      style={{
        background: "none",
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
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s",
      }}
    >
      <FaUserCircle size={36} color="#555" />
    </button>
  )
}
