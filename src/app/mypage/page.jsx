// mypage
"use client"
import "../globals.css"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import { apiGet, apiPost, apiDelete, parseJsonResponse } from "../utils/apiHelper"
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
  const [pwConfirm, setPwConfirm] = useState("")
  const [editMsg, setEditMsg] = useState("")
  const [apiError, setApiError] = useState("")
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
        console.log("마이페이지 - API 응답:", data)
        console.log("마이페이지 - API 응답 타입:", typeof data)
        console.log("마이페이지 - API 응답 키들:", Object.keys(data))
        
        // 서버 응답 구조에 맞게 데이터 추출
        let userData = null
        
        console.log("마이페이지 - data.user:", data.user)
        console.log("마이페이지 - data.user 타입:", typeof data.user)
        
        if (data.success && data.user) {
          // data.user가 객체인지 배열인지 확인
          if (Array.isArray(data.user)) {
            userData = data.user[0]
          } else if (data.user.data && Array.isArray(data.user.data)) {
            userData = data.user.data[0]
          } else {
            userData = data.user
          }
        } else if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
          userData = data.data[0]
        } else if (data.data && data.data.user) {
          userData = Array.isArray(data.data.user) ? data.data.user[0] : data.data.user
        } else if (Array.isArray(data)) {
          userData = data[0]
        } else if (data.data) {
          userData = Array.isArray(data.data) ? data.data[0] : data.data
        }

        console.log("마이페이지 - 사용자 데이터:", userData)
        
        if (userData) {
          console.log("마이페이지 - 사용자 데이터 키들:", Object.keys(userData))
          
          // 비밀번호 필드가 있는지 확인
          if (userData.Password || userData.password || userData.Pw || userData.pw) {
            console.log("⚠️ 마이페이지 - 비밀번호 필드가 포함되어 있습니다!")
          }

          const updatedUser = {
            id: userData.Id || "",
            name: userData.Name || "",
            phone: userData.Phone || "",
            email: userData.Email || "",
          }
          
          console.log("마이페이지 - 받아온 사용자 데이터:", userData)
          console.log("마이페이지 - 추출된 사용자 정보:", updatedUser)
          
          // 비밀번호나 다른 민감한 정보가 있는지 확인하고 제거
          if (userData.Password || userData.password || userData.Pw || userData.pw) {
            console.log("⚠️ 마이페이지 - 비밀번호 필드가 서버 응답에 포함되어 있습니다. 제거합니다.")
          }
          console.log("마이페이지 - 업데이트할 사용자 정보:", updatedUser)

          // 사용자 정보를 직접 설정
          setUser(updatedUser)
          console.log("마이페이지 - 사용자 정보 설정 완료:", updatedUser)

          // 이메일 분리
          const email = userData.Email
          if (email) {
            const parts = email.split("@")
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
        } else {
          console.log("마이페이지 - 사용자 데이터를 찾을 수 없습니다:", data)
          console.log("마이페이지 - 전체 응답 구조:", JSON.stringify(data, null, 2))
        }
      })
      .catch((error) => {
        console.error("마이페이지 - API 오류:", error)
        console.error("마이페이지 - 오류 상세:", error.message)
        console.error("마이페이지 - 오류 스택:", error.stack)
        setApiError(error.message || "API 호출 실패")
      })
  }, [])

  // 사용자 정보 변경 감지
  useEffect(() => {
    console.log("마이페이지 - 사용자 정보 변경됨:", user)
  }, [user])

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
      const domain =
        emailDomain === "직접입력" ? customEmailDomain.trim() : emailDomain
      const email = `${emailId.trim()}@${domain}`
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
        <div className={styles["mypage-popup"]}>회원정보가 수정되었습니다.</div>
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
