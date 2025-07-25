// mypage
"use client"
import "../globals.css"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import styles from "./mypage.module.css"

// 전화번호 하이픈 자동 삽입 함수
const formatPhoneNumber = (value) => {
  const number = value.replace(/[^0-9]/g, "")
  if (number.length < 4) return number
  if (number.length < 7) return number.replace(/(\d{3})(\d{1,3})/, "$1-$2")
  if (number.length < 11)
    return number.replace(/(\d{3})(\d{3,4})(\d{1,4})/, "$1-$2-$3")
  return number.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
}

export default function MyPage() {
  const [user, setUser] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
  })
  const [pw, setPw] = useState("")
  const [editMsg, setEditMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [emailId, setEmailId] = useState("")
  const [emailDomain, setEmailDomain] = useState("wsu.ac.kr")
  const [customEmailDomain, setCustomEmailDomain] = useState("")
  function handleEmailChange(e) {
    const { name, value } = e.target
    if (name === "emailId") setEmailId(value)
    else if (name === "emailDomain") setEmailDomain(value)
    else if (name === "customEmailDomain") setCustomEmailDomain(value)
  }

  // 마이 페이지 정보
  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("id") : ""
    setUser((u) => ({ ...u, id: id || "" }))
    if (!id) return
    fetch(`/api/mypage-route?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (
          data.success &&
          data.user &&
          Array.isArray(data.user) &&
          data.user[0]
        ) {
          const userData = data.user[0]
          setUser((u) => ({
            ...u,
            id: userData.Id || "",
            name: userData.Name || "",
            phone: userData.Phone || "",
            email: userData.Email || "",
          }))
          // 이메일 분리
          if (userData.Email) {
            const parts = userData.Email.split("@")
            setEmailId(parts[0] || "")
            const domainList = [
              "wsu.ac.kr",
              "naver.com",
              "gmail.com",
              "hanmail.net",
              "nate.com",
            ]
            if (domainList.includes(parts[1])) {
              setEmailDomain(parts[1])
              setCustomEmailDomain("")
            } else {
              setEmailDomain("직접입력")
              setCustomEmailDomain(parts[1] || "")
            }
          }
        }
      })
      .catch(() => {})
  }, [])

  // 수정 핸들러
  const handleEdit = async (e) => {
    e.preventDefault()
    setEditMsg("")
    setLoading(true)
    try {
      const domain =
        emailDomain === "직접입력" ? customEmailDomain.trim() : emailDomain
      const email = `${emailId.trim()}@${domain}`
      const res = await fetch("/api/mypage-route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          pw: pw || undefined,
          phone: user.phone,
          email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 2000)
        setPw("")
      } else {
        setEditMsg(data.error || "수정 실패")
      }
    } catch {
      setEditMsg("회원정보 수정 중 오류")
    }
    setLoading(false)
  }

  // 로그아웃 핸들러
  const handleLogout = () => {
    const id = typeof window !== "undefined" ? localStorage.getItem("id") : ""
    if (typeof window !== "undefined") {
      localStorage.removeItem("id")
      localStorage.removeItem("name")
    }
    fetch("/api/logout-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    window.location.href = "/login"
  }

  // 계정 삭제 핸들러
  const handleDeleteAccount = async () => {
    setDeleteMsg("")
    if (!window.confirm("정말로 계정을 삭제하시겠습니까?")) return
    setDeleting(true)
    try {
      const res = await fetch("/api/user-route", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("id")
          localStorage.removeItem("name")
        }
        fetch("/api/logout-route", { method: "POST" })
        alert("계정이 삭제되었습니다.")
        window.location.href = "/login"
      } else {
        setDeleteMsg(data.error || "계정 삭제 실패")
      }
    } catch {
      setDeleteMsg("계정 삭제 중 오류가 발생했습니다.")
    }
    setDeleting(false)
  }

  return (
    <div className={styles["mypage-container"]}>
      {/* 메뉴바: 항상 최상단에 위치 */}
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {/* 팝업 메시지 */}
      {showPopup && (
        <div className={styles["mypage-popup"]}>회원정보가 수정되었습니다.</div>
      )}
      <div className={styles["mypage-box"]}>
        <div className={styles["mypage-title"]}>마이페이지</div>
        <form onSubmit={handleEdit} className={styles["mypage-form"]}>
          <input
            className={styles["mypage-input"]}
            value={user.id}
            disabled
            placeholder="아이디"
          />
          <input
            className={styles["mypage-input"]}
            value={user.name}
            disabled
            placeholder="이름"
          />
          <input
            className={styles["mypage-input"]}
            value={user.phone || ""}
            onChange={(e) =>
              setUser((u) => ({
                ...u,
                phone: formatPhoneNumber(e.target.value),
              }))
            }
            placeholder="전화번호"
          />
          {/* 이메일 입력 분리 */}
          <div className={styles["email-input-wrapper"]}>
            <input
              name="emailId"
              type="text"
              placeholder="이메일"
              value={emailId}
              onChange={handleEmailChange}
              required
              className={styles["email-id-input"]}
              autoComplete="off"
            />
            <span className={styles["email-at"]}>@</span>
            {emailDomain === "직접입력" ? (
              <input
                name="customEmailDomain"
                type="text"
                placeholder="도메인 직접 입력 (예: example.com)"
                value={customEmailDomain}
                onChange={handleEmailChange}
                required
                className={styles["email-domain-input"]}
                autoComplete="off"
              />
            ) : (
              <select
                name="emailDomain"
                value={emailDomain}
                onChange={handleEmailChange}
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
          <input
            className={styles["mypage-input"]}
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="새 비밀번호"
          />
          <button
            type="submit"
            disabled={loading}
            className={styles["mypage-btn-main"]}
          >
            {loading ? "저장 중..." : "회원정보 수정"}
          </button>
        </form>
        {editMsg && (
          <div
            className={
              styles["mypage-message"] +
              " " +
              (editMsg.includes("수정") ? styles.success : styles.error)
            }
          >
            {editMsg}
          </div>
        )}
        <button onClick={handleLogout} className={styles["mypage-btn-sub"]}>
          로그아웃
        </button>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className={styles["mypage-btn-danger"]}
        >
          {deleting ? "계정 삭제 중..." : "계정 삭제"}
        </button>
        {deleteMsg && (
          <div className={styles["mypage-message"] + " " + styles.error}>
            {deleteMsg}
          </div>
        )}
      </div>
    </div>
  )
}
