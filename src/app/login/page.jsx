// 로그인
"use client"
import "../globals.css"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"
import LoadingOverlay from "../components/loadingoverlay"
import { resetSessionExpired } from "../utils/apiHelper"

export default function LoginPage() {
  const idRef = useRef(null)
  const pwRef = useRef(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 로그인 핸들러
  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const id = idRef.current.value
    const pw = pwRef.current.value

    try {
      const res = await fetch("/api/login-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw })
      })
      const data = await res.json()
      if (data.success && data.token) {
        // 세션 만료 상태 리셋
        resetSessionExpired()
        
        // 토큰과 사용자 정보를 localStorage에 저장
        localStorage.setItem("token", data.token)
        localStorage.setItem("userId", data.user.id)
        localStorage.setItem("userName", data.user.name)
        localStorage.setItem("islogin", "true")
        
        console.log("로그인 성공 - 저장된 토큰:", localStorage.getItem("token"))
        console.log("저장된 사용자 ID:", localStorage.getItem("userId"))
        
        router.push("/management")
      } else {
        console.log("로그인 실패 - 응답:", data)
        setError(data.message || "로그인 실패")
      }
    } catch (err) {
      console.error("로그인 오류:", err)
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }

  // 회원가입 이동 핸들러
  const goToSignup = (e) => {
    e.preventDefault()
    router.push("/signup")
  }

  return (
    <div className={styles["login-container"]}>
      {loading && <LoadingOverlay />}
      <div className={styles["login-box"]}>
        <h2 className={styles["login-title"]}>로그인</h2>
        <form onSubmit={handleLogin} className={styles["login-form"]}>
          <input
            name="id"
            type="text"
            placeholder="아이디"
            ref={idRef}
            required
            className={styles["login-input"]}
            autoComplete="username"
          />
          <input
            name="pw"
            type="password"
            placeholder="비밀번호"
            ref={pwRef}
            required
            className={styles["login-input"]}
            autoComplete="current-password"
          />

          {/* 로그인 버튼만 남기고 회원가입 버튼 제거 */}
          <button
            type="submit"
            className={styles["login-btn"]}
            disabled={loading}
          >
            {loading ? "로딩 중..." : "로그인"}
          </button>

          {error && <div className={styles["login-error"]}>{error}</div>}
        </form>
        <div className={styles["login-link-box"]}>
          계정이 없으신가요?{" "}
          <a
            href="/signup"
            onClick={goToSignup}
            className={styles["login-link"]}
            style={{ cursor: "pointer" }}
          >
            회원가입
          </a>
        </div>
      </div>
    </div>
  )
}
