// 마이 페이지
"use client"
import "../globals.css"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay" // prettier-ignore
import { apiGet, apiPost, apiDelete, parseJsonResponse, extractUserData, formatPhoneNumber } from "../utils/apiHelper"
import styles from "./mypage.module.css"

export default function MyPage() {
  const [user, setUser] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    emailId: "",
    emailDomain: "wsu.ac.kr",
    isCustomDomain: false,
  })
  const [pw, setPw] = useState("")
  const [pwConfirm, setPwConfirm] = useState("")
  const [editMsg, setEditMsg] = useState("")
  const [apiError, setApiError] = useState("")
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  // 마이 페이지 정보
  useEffect(() => {
    const id =
      typeof window !== "undefined" ? localStorage.getItem("userId") : ""
    console.log("마이페이지 - localStorage id:", id)
    setUser((u) => ({ ...u, id: id || "" }))
    if (!id) {
      console.log("마이페이지 - id가 없음")
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return
    }

    // 비밀번호 확인 없이 직접 접근한 경우 verify-password 페이지로 리다이렉트
    const hasVerifiedPassword = sessionStorage.getItem("passwordVerified")
    if (!hasVerifiedPassword) {
      if (typeof window !== "undefined") {
        window.location.href = "/mypage/verify-password"
      }
      return
    }
    // 토큰을 포함하여 마이페이지 정보 가져오기
    const token = localStorage.getItem('token')
    if (!token) {
      console.log("마이페이지 - 토큰이 없습니다.")
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return
    }
    
    console.log("마이페이지 - API 호출 시작, id:", id)
    apiGet(`/api/mypage-route?id=${encodeURIComponent(id)}`)
      .then(parseJsonResponse)
      .then((data) => {
        const userData = extractUserData(data)
        if (userData) {
          setUser((prev) => ({
            ...prev,
            id: userData.Id || prev.id,
            name: userData.Name || "",
            phone: userData.Phone || "",
            email: userData.Email || "",
          }))

          // 이메일 분리
          const email = userData.Email
          if (email) {
            const parts = email.split("@")
            const emailIdPart = parts[0] || ""
            const domainPart = parts[1] || ""
            const domainList = [
              "wsu.ac.kr",
              "naver.com",
              "gmail.com",
              "hanmail.net",
              "nate.com",
            ]
            const isKnownDomain = domainList.includes(domainPart)
            setUser((prev) => ({
              ...prev,
              emailId: emailIdPart,
              emailDomain: isKnownDomain ? domainPart : "직접입력",
              isCustomDomain: !isKnownDomain,
              customEmailDomain: isKnownDomain ? "" : domainPart,
            }))
            } else {
            setUser((prev) => ({ ...prev, emailId: "", emailDomain: "wsu.ac.kr", isCustomDomain: false }))
          }
        } else {
          setApiError("사용자 정보를 불러오지 못했습니다.")
        }
      })
      .catch((error) => {
        setApiError(error.message || "API 호출 실패")
      })
  }, [])

  // 비번, 이메일, 전화번호 수정 핸들러
  const handleEdit = async (e) => {
    e.preventDefault()
    setEditMsg("")

    if (pw && pw !== pwConfirm) {
      setEditMsg("새 비밀번호가 일치하지 않습니다.")
      return
    }

    setLoading(true)
    try {
      const domain = user.isCustomDomain ? user.customEmailDomain.trim() : user.emailDomain
      const email = `${user.emailId.trim()}@${domain}`
      const res = await fetch("/api/mypage-route", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
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
        setPwConfirm("")
      } else {
        setEditMsg(data.error || data.message || "수정 실패")
      }
    } catch (error) {
      setEditMsg(error.message || "회원정보 수정 중 오류")
    }
    setLoading(false)
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const id =
      typeof window !== "undefined" ? localStorage.getItem("userId") : ""
    try {
      await apiPost("/api/logout-route", { id })
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error)
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("userId")
        localStorage.removeItem("userName")
        localStorage.removeItem("islogin")
        localStorage.removeItem("token")
        sessionStorage.removeItem("passwordVerified")
      }
      window.location.href = "/login"
    }
  }

  // 계정 삭제 핸들러
  const handleDeleteAccount = async () => {
    setDeleteMsg("")
    if (!window.confirm("정말로 계정을 삭제하시겠습니까?")) return
    setDeleting(true)
    try {
      const res = await apiDelete("/api/user-route", { id: user.id })
      const data = await parseJsonResponse(res)
      if (data.success) {
        // 로그아웃 API 호출
        try {
          await apiPost("/api/logout-route", { id: user.id })
        } catch (error) {
          console.error("로그아웃 API 호출 실패:", error)
        }
        
        if (typeof window !== "undefined") {
          localStorage.removeItem("userId")
          localStorage.removeItem("userName")
          localStorage.removeItem("islogin")
          localStorage.removeItem("token")
          sessionStorage.removeItem("passwordVerified")
        }
        alert("계정이 삭제되었습니다.")
        window.location.href = "/login"
      } else {
        setDeleteMsg(data.error || "계정 삭제 실패")
      }
    } catch (error) {
      setDeleteMsg(error.message || "계정 삭제 중 오류가 발생했습니다.")
    }
    setDeleting(false)
  }

  return (
    <div className={styles["mypage-container"]}>
      {loading && <LoadingOverlay />}
      {/* 메뉴바: 항상 최상단에 위치 */}
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {/* 팝업 메시지 */}
      {showPopup && (
        <div className={styles["toast-popup"]}>회원정보가 수정되었습니다.</div>
      )}
      <div className={styles["mypage-box"]}>
        <div className={styles["mypage-title"]}>마이페이지</div>
        <form onSubmit={handleEdit} className={styles["mypage-form"]}>
          <input
            className={styles["mypage-input"]}
            value={user.id || ""}
            disabled
            placeholder="아이디"
          />
          <input
            className={styles["mypage-input"]}
            value={user.name || ""}
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
              value={user.emailId}
              onChange={(e) => setUser({ ...user, emailId: e.target.value })}
              required
              className={styles["email-id-input"]}
              autoComplete="off"
            />
            <span className={styles["email-at"]}>@</span>
            {user.isCustomDomain ? (
              <input
                name="customEmailDomain"
                type="text"
                placeholder="도메인 직접 입력 (예: example.com)"
                value={user.customEmailDomain}
                onChange={(e) => setUser({ ...user, customEmailDomain: e.target.value })}
                required
                className={styles["email-domain-input"]}
                autoComplete="off"
              />
            ) : (
              <select
                name="emailDomain"
                value={user.emailDomain}
                onChange={(e) =>
                  setUser({ ...user, emailDomain: e.target.value, isCustomDomain: e.target.value === "직접입력" })
                }
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
          <input
            className={styles["mypage-input"]}
            type="password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
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
