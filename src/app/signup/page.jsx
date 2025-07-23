"use client"
import "../globals.css"
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./signup.module.css"

export default function SignupPage() {
  const [form, setForm] = useState({
    id: "",
    pw: "",
    name: "",
    phone: "",
    emailId: "",
    emailDomain: "wsu.ac.kr",
    customEmailDomain: "",
  })
  const [error, setError] = useState("")
  const router = useRouter()

  // 전화번호 하이픈 자동 삽입 함수
  const formatPhoneNumber = (value) => {
    const number = value.replace(/[^0-9]/g, "")
    if (number.length < 4) return number
    if (number.length < 7) {
      return number.replace(/(\d{3})(\d{1,3})/, "$1-$2")
    }
    if (number.length < 11) {
      return number.replace(/(\d{3})(\d{3,4})(\d{1,4})/, "$1-$2-$3")
    }
    return number.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhoneNumber(value) }))
    } else if (name === "emailDomain") {
      setForm((prev) => ({
        ...prev,
        emailDomain: value,
        customEmailDomain: "",
      }))
    } else if (name === "customEmailDomain") {
      setForm((prev) => ({ ...prev, customEmailDomain: value }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const domain =
      form.emailDomain === "직접입력"
        ? form.customEmailDomain.trim()
        : form.emailDomain

    if (!form.emailId.trim()) {
      setError("이메일 아이디를 입력해주세요.")
      return
    }
    if (!domain) {
      setError("이메일 도메인을 입력해주세요.")
      return
    }
    const email = `${form.emailId.trim()}@${domain}`
    const submitData = {
      id: form.id,
      pw: form.pw,
      name: form.name,
      phone: form.phone,
      email,
    }

    try {
      const res = await fetch("/api/signup-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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
            autoComplete="username"
          />
          <input
            name="pw"
            type="password"
            placeholder="비밀번호"
            value={form.pw}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
            autoComplete="new-password"
          />
          <input
            name="name"
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
            autoComplete="name"
          />
          <input
            name="phone"
            type="text"
            placeholder="전화번호"
            value={form.phone}
            onChange={handleChange}
            required
            className={styles["signup-input"]}
            maxLength={13}
            autoComplete="tel"
          />

          {/* 이메일 입력 분리 */}
          <div className={styles["email-input-wrapper"]}>
            <input
              name="emailId"
              type="text"
              placeholder="이메일"
              value={form.emailId}
              onChange={handleChange}
              required
              className={styles["email-id-input"]}
              autoComplete="off"
            />
            <span className={styles["email-at"]}>@</span>
            {form.emailDomain === "직접입력" ? (
              <input
                name="customEmailDomain"
                type="text"
                placeholder="도메인 직접 입력 (예: example.com)"
                value={form.customEmailDomain}
                onChange={handleChange}
                required
                className={styles["email-domain-input"]}
                autoComplete="off"
              />
            ) : (
              <select
                name="emailDomain"
                value={form.emailDomain}
                onChange={handleChange}
                className={styles["email-domain-select"]}
                required
              >
                <option value="wsu.ac.kr">wsu.ac.kr</option>
                <option value="naver.com">naver.com</option>
                <option value="gmail.com">gmail.com</option>
                <option value="hanmail.net">hanmail.net</option>
                <option value="nate.com">nate.com</option>
                <option value="직접입력">직접입력</option>
              </select>
            )}
          </div>

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
