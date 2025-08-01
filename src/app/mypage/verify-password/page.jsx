// verify-password
"use client"
import "../mypage.module.css"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../mypage.module.css"

export default function VerifyPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleVerifyPassword = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const userId = localStorage.getItem("userId")

      if (!userId) {
        setError("로그인이 필요합니다.")
        setLoading(false)
        return
      }

      // login-route를 호출해서 비밀번호 확인
      const res = await fetch("/api/login-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          pw: currentPassword,
        }),
      })

      const data = await res.json()

      if (res.ok && data.islogin) {
        // 비밀번호 확인 성공 시 sessionStorage에 플래그 설정
        sessionStorage.setItem("passwordVerified", "true")
        // 마이페이지로 이동
        router.push("/mypage")
      } else {
        setError("비밀번호가 일치하지 않습니다.")
      }
    } catch (err) {
      setError("서버 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/management")
  }

  return (
    <div className={styles["mypage-container"]}>
      <div className={styles["mypage-box"]}>
        <div className={styles["mypage-title"]}>비밀번호 확인</div>
        <div
          style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}
        >
          마이페이지에 접근하기 위해 현재 비밀번호를 입력해주세요.
        </div>
        <form onSubmit={handleVerifyPassword} className={styles["mypage-form"]}>
          <input
            className={styles["mypage-input"]}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호"
            required
            autoFocus
          />
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              className={styles["mypage-btn-sub"]}
              style={{ flex: 1, maxWidth: "calc(50% - 5px)" }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles["mypage-btn-main"]}
              style={{ flex: 1, maxWidth: "calc(50% - 5px)" }}
            >
              {loading ? "확인 중..." : "확인"}
            </button>
          </div>
        </form>
        {error && (
          <div className={styles["mypage-message"] + " " + styles.error}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
