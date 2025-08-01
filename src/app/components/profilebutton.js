// profilebutton
"use client"
import { useRouter } from "next/navigation"
import { FaUserCircle } from "react-icons/fa"

export default function ProfileButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push("/mypage/verify-password")}
      aria-label="마이페이지로 이동"
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
      }}
    >
      <FaUserCircle size={36} color="#555" />
    </button>
  )
}
