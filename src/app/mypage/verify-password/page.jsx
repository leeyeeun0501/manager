// verify-password
"use client"
import "../mypage.module.css"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { apiPost, parseJsonResponse } from "../../utils/apiHelper"
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
      const res = await apiPost("/api/login-route", {
        id: userId,
        pw: currentPassword,
      })

      const data = await parseJsonResponse(res)

      if (data.success && data.islogin) {
        // 비밀번호 확인 성공 시 sessionStorage에 플래그 설정
        sessionStorage.setItem("passwordVerified", "true")
        // 마이페이지로 이동
        router.push("/mypage")
      } else {
        setError("비밀번호가 일치하지 않습니다.")
      }
    } catch (err) {
      // 401 오류인 경우 비밀번호 불일치로 처리
      if (err.message.includes("인증이 필요합니다") || err.message.includes("로그인 실패")) {
        setError("비밀번호가 일치하지 않습니다.")
      } else {
        setError(err.message || "서버 오류가 발생했습니다.")
      }
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
