// 비밀번호 확인
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

  const handleVerifyPassword = (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const userId = localStorage.getItem("userId")
      const storedPasswordHash = localStorage.getItem("userPasswordHash")

      if (!userId) {
        setError("로그인이 필요합니다.")
        setLoading(false)
        return
      }

      if (!storedPasswordHash) {
        setError("비밀번호 정보를 찾을 수 없습니다. 다시 로그인해주세요.")
        setLoading(false)
        return
      }

      // 입력된 비밀번호를 해시화하여 저장된 해시와 비교
      const inputPasswordHash = btoa(currentPassword)

      if (inputPasswordHash === storedPasswordHash) {
        // 비밀번호 확인 성공 시 sessionStorage에 플래그 설정
        sessionStorage.setItem("passwordVerified", "true")
        // 마이페이지로 이동
        router.push("/mypage")
      } else {
        setError("비밀번호가 일치하지 않습니다.")
      }
    } catch (err) {
      setError("비밀번호 확인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // 이전 페이지로 돌아가기
    router.back()
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
