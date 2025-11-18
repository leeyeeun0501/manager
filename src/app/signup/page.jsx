// 회원가입
"use client"
import "../globals.css"
import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import styles from "./signup.module.css"
import LoadingOverlay from "../components/loadingoverlay"
import { formatPhoneNumber } from "../utils/apiHelper"
import EmailInput from "./EmailInput" // EmailInput 컴포넌트 임포트

export default function SignupPage() {
  const formRef = useRef(null)
  const idRef = useRef(null)
  const pwRef = useRef(null)
  const pwConfirmRef = useRef(null)
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  // 이메일 관련 상태를 객체로 통합 관리
  const [email, setEmail] = useState({ id: "", domain: "wsu.ac.kr", customDomain: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 입력 핸들러
  const handlePhoneInput = (e) => {
    e.target.value = formatPhoneNumber(e.target.value)
  }

  // 유효성 검사 함수
  const validateForm = (data) => {
    if (data.pw !== data.pwConfirm) {
      return "비밀번호가 일치하지 않습니다."
    }
    if (data.pw.length < 4) { // 비밀번호 길이 정책에 맞게 수정 (예: 4자)
      return "비밀번호는 4자 이상이어야 합니다."
    }
    if (!data.email.id.trim() || (!data.email.domain && !data.email.customDomain)) {
      return "이메일을 올바르게 입력해주세요."
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
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const id = idRef.current.value
      const pw = pwRef.current.value
      const pwConfirm = pwConfirmRef.current.value
      const name = nameRef.current.value
      const phone = phoneRef.current.value

      const validationError = validateForm({ pw, pwConfirm, email })
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }

      // EmailInput 상태를 기반으로 최종 이메일 주소 생성
      const finalDomain = email.domain === "직접입력" ? email.customDomain.trim() : email.domain
      const finalEmail = `${email.id.trim()}@${finalDomain}`
      const submitData = { id, pw, name, phone, email: finalEmail }

      await registerUser(submitData)
      alert("회원가입이 완료되었습니다.")
      router.push("/login")
    } catch (err) {
      setError(err.message || "회원가입 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [email, router])

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

          {/* EmailInput 컴포넌트 사용 */}
          <EmailInput value={email} onChange={setEmail} styles={styles} />

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
