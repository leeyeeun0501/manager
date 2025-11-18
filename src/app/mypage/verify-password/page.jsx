// 비밀번호 확인
"use client"
import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import styles from "../mypage.module.css"

export default function VerifyPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleVerifyPassword = useCallback(async (e) => {
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
      
      const token = localStorage.getItem("token")
      if (!token) {
        setError("인증 정보가 없습니다. 다시 로그인해주세요.")
        setLoading(false)
        return
      }

      const res = await fetch('/api/mypage-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId, pw: currentPassword }),
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        // 비밀번호 확인 성공 시 sessionStorage에 플래그 설정
        sessionStorage.setItem("passwordVerified", "true")
        // 마이페이지로 이동
        router.push("/mypage")
      } else {
        setError(data.message || "비밀번호가 일치하지 않습니다.")
      }
    } catch (err) {
      setError("비밀번호 확인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [currentPassword, router])

  const handleCancel = useCallback(() => {
    // 이전 페이지로 돌아가기
    router.back()
  }, [router])

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
