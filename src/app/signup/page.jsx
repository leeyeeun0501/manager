// 회원가입
"use client"
import "../globals.css"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "./signup.module.css"
import LoadingOverlay from "../components/loadingoverlay"

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

export default function SignupPage() {
  const formRef = useRef(null)
  const idRef = useRef(null)
  const pwRef = useRef(null)
  const pwConfirmRef = useRef(null)
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  const emailIdRef = useRef(null)
  const emailDomainRef = useRef(null)
  const customEmailDomainRef = useRef(null)

  const [isCustomDomain, setIsCustomDomain] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 입력 핸들러
  const handlePhoneInput = (e) => {
    e.target.value = formatPhoneNumber(e.target.value)
  }

  const handleDomainChange = (e) => {
    setIsCustomDomain(e.target.value === "직접입력")
  }

  // 유효성 검사 함수
  const validateForm = (data) => {
    if (data.pw !== data.pwConfirm) {
      return "비밀번호가 일치하지 않습니다."
    }
    if (data.pw.length < 6) {
      return "비밀번호는 6자 이상이어야 합니다."
    }
    if (!data.emailId.trim() || !data.domain) {
      return "이메일을 입력해주세요."
    }
    return null
  }

  // 회원가입 API 호출 함수
  const registerUser = async (submitData) => {
    const res = await fetch("/api/signup-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || "회원가입에 실패했습니다.")
    }
    return res.json()
  }

  // 비번 한 번 더 확인 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const id = idRef.current.value
      const pw = pwRef.current.value
      const pwConfirm = pwConfirmRef.current.value
      const name = nameRef.current.value
      const phone = phoneRef.current.value
      const emailId = emailIdRef.current.value
      const emailDomain = emailDomainRef.current.value
      const customEmailDomain = customEmailDomainRef.current?.value || ""

      const domain =
        emailDomain === "직접입력" ? customEmailDomain.trim() : emailDomain

      const validationError = validateForm({ pw, pwConfirm, emailId, domain })
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }

      const email = `${emailId.trim()}@${domain}`
      const submitData = { id, pw, name, phone, email }

      await registerUser(submitData)
      alert("회원가입이 완료되었습니다.")
      router.push("/login")
    } catch (err) {
      setError(err.message || "회원가입 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 로그인 이동 핸들러
  const goToLogin = (e) => {
    e.preventDefault()
    router.push("/login")
  }

  return (
    <div className={styles["signup-container"]}>
      {loading && <LoadingOverlay />}
      <div className={styles["signup-box"]}>
        <h2 className={styles["signup-title"]}>회원가입</h2>
        <form ref={formRef} onSubmit={handleSubmit} className={styles["signup-form"]}>
          <input
            name="id"
            type="text"
            placeholder="아이디"
            ref={idRef}
            required
            className={styles["signup-input"]}
            autoComplete="username"
          />
          <input
            name="pw"
            type="password"
            placeholder="비밀번호"
            ref={pwRef}
            required
            className={styles["signup-input"]}
            autoComplete="new-password"
          />
          <input
            name="pwConfirm"
            type="password"
            placeholder="비밀번호 확인"
            ref={pwConfirmRef}
            required
            className={styles["signup-input"]}
            autoComplete="new-password"
          />
          <input
            name="name"
            type="text"
            placeholder="이름"
            ref={nameRef}
            required
            className={styles["signup-input"]}
            autoComplete="name"
          />
          <input
            name="phone"
            type="text"
            placeholder="전화번호"
            ref={phoneRef}
            onInput={handlePhoneInput}
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
              ref={emailIdRef}
              required
              className={styles["email-id-input"]}
              autoComplete="off"
            />
            <span className={styles["email-at"]}>@</span>
            {isCustomDomain ? (
              <input
                name="customEmailDomain"
                type="text"
                placeholder="도메인 직접 입력 (예: example.com)"
                ref={customEmailDomainRef}
                required
                className={styles["email-domain-input"]}
                autoComplete="off"
              />
            ) : (
              <select
                name="emailDomain"
                ref={emailDomainRef}
                onChange={handleDomainChange}
                defaultValue="wsu.ac.kr"
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

          <button
            type="submit"
            className={styles["signup-btn"]}
            disabled={loading}
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
          {error && <div className={styles["signup-error"]}>{error}</div>}
        </form>
        <div className={styles["signup-link-box"]}>
          이미 계정이 있으신가요?{" "}
          <a
            href="/login"
            onClick={goToLogin}
            className={styles["signup-link"]}
          >
            로그인
          </a>
        </div>
      </div>
    </div>
  )
}
