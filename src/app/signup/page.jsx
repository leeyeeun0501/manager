// signup
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./signup.module.css"

export default function SignupPage() {
  const [form, setForm] = useState({
    id: "",
    pw: "",
    name: "",
    phone: "",
    email: "",
  })
  const [error, setError] = useState("")
  const router = useRouter()

  // 핸들러 함수
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("/api/signup-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        alert("회원가입이 완료되었습니다.")
        router.push("/login")
      } else {
        const data = await res.json()
        setError(data.message || "회원가입에 실패했습니다.")
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다.")
    }
  }

  const goToLogin = (e) => {
    e.preventDefault()
    router.push("/login")
  }

  return (
    <div className={styles["signup-container"]}>
      <div className={styles["signup-box"]}>
        <h2 className={styles["signup-title"]}>회원가입</h2>
        <form onSubmit={handleSubmit} className={styles["signup-form"]}>
          <input
            name="id"
            type="text"
            placeholder="아이디"
            value={form.id}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
          />
          <input
            name="pw"
            type="password"
            placeholder="비밀번호"
            value={form.pw}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
          />
          <input
            name="name"
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
          />
          <input
            name="phone"
            type="text"
            placeholder="전화번호"
            value={form.phone}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
          />
          <input
            name="email"
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
          />
          <button type="submit" className={styles["signup-btn"]}>
            회원가입
          </button>
          {error && <div className={styles["signup-error"]}>{error}</div>}
        </form>
        <div className={styles["signup-link-box"]}>
          이미 계정이 있으신가요?{" "}
          <a
            href="/login"
            onClick={goToLogin}
            className={styles["signup-link"]}
            style={{ cursor: "pointer" }}
          >
            로그인
          </a>
        </div>
      </div>
    </div>
  )
}
