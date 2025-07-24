"use client"
import "../globals.css"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"

export default function LoginPage() {
  const [id, setId] = useState("")
  const [pw, setPw] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 네이버 지도 API 스크립트 미리 로드
  useEffect(() => {
    if (typeof window === "undefined") return
    const existing = document.querySelector('script[src*="maps.js"]')
    if (existing) return
    const script = document.createElement("script")
    script.src =
      "https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=yxffktqahm"
    script.async = true
    script.onload = () => {
      // 필요시 콘솔에 로드 성공 메시지
      // console.log("네이버 지도 API 로드 완료")
    }
    script.onerror = (e) => {
      console.error("네이버 지도 API 스크립트 로드 실패", e)
    }
    document.head.appendChild(script)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/login-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      })
      const data = await res.json()
      if (data.islogin) {
        localStorage.setItem("id", data.id)
        localStorage.setItem("name", data.name)
        localStorage.setItem("islogin", data.islogin)
        router.push("/management")
      } else {
        setError(data.error || "로그인 실패")
      }
    } catch (err) {
      setError("서버 오류")
    } finally {
      setLoading(false)
    }
  }

  const goToSignup = (e) => {
    e.preventDefault()
    router.push("/signup")
  }

  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-box"]}>
        <h2 className={styles["login-title"]}>로그인</h2>
        <form onSubmit={handleLogin} className={styles["login-form"]}>
          <input
            name="id"
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className={styles["login-input"]}
            autoComplete="username"
          />
          <input
            name="pw"
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
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
            {loading ? "로딩중..." : "로그인"}
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
