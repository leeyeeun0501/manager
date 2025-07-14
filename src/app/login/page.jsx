"use client"
import "../globals.css"
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"

export default function LoginPage() {
  const [id, setId] = useState("")
  const [pw, setPw] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        <div className={styles["login-title"]}>로그인</div>
        <form onSubmit={handleLogin} className={styles["login-form"]}>
          <input
            className={styles["login-input"]}
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            disabled={loading}
            autoComplete="username"
          />
          <input
            className={styles["login-input"]}
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            className={styles["login-btn"]}
            type="submit"
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
          {error && <div className={styles["login-error"]}>{error}</div>}
        </form>
        <div className={styles["login-link-box"]}>
          계정이 없으신가요?{" "}
          <span className={styles["login-link"]} onClick={goToSignup}>
            회원가입
          </span>
        </div>
      </div>
    </div>
  )
}
