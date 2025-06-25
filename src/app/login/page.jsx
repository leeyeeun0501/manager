// login/page.jsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import "./login.css"

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
      console.log("데이터", data)
      if (id == data.id) {
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

  // 회원가입 페이지 이동
  const goToSignup = (e) => {
    e.preventDefault()
    router.push("/signup")
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">로그인</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className="login-input"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            className="login-input"
            disabled={loading}
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
        <div className="login-link-box">
          계정이 없으신가요?{" "}
          <a href="/signup" onClick={goToSignup} className="login-link">
            회원가입
          </a>
        </div>
      </div>
    </div>
  )
}
