// 마이 페이지
"use client"
import "../globals.css"
import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import { apiGet, apiPost, apiDelete, parseJsonResponse, extractUserData, formatPhoneNumber } from "../utils/apiHelper"
import styles from "./mypage.module.css"
import EmailInput from "../signup/EmailInput"

export default function MyPage() {
  const [user, setUser] = useState({
    id: "",
    name: "",
    phone: "",
  })
  // 이메일 상태를 EmailInput 컴포넌트와 연동하기 위해 분리
  const [email, setEmail] = useState({
    id: "",
    domain: "wsu.ac.kr",
    customDomain: "",
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
  const router = useRouter()

  // 마이 페이지 정보
  useEffect(() => {
    const id =
      typeof window !== "undefined" ? localStorage.getItem("userId") : ""
    console.log("마이페이지 - localStorage id:", id)
    setUser((u) => ({ ...u, id: id || "" }))

    // 비밀번호 확인 없이 직접 접근한 경우 verify-password 페이지로 리다이렉트
    const hasVerifiedPassword = sessionStorage.getItem("passwordVerified")
    const token = localStorage.getItem("token")

    if (!id || !token) {
      console.log("마이페이지 - id 또는 토큰이 없음")
      router.replace("/login")
      return
    }

    if (!hasVerifiedPassword) {
      router.replace("/mypage/verify-password")
      return
    }
    // 토큰을 포함하여 마이페이지 정보 가져오기
    
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
          }))

          // 이메일 상태 설정
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
            setEmail({
              id: emailIdPart,
              domain: isKnownDomain ? domainPart : "직접입력",
              customEmailDomain: isKnownDomain ? "" : domainPart,
            })
          } else {
            setEmail({ id: "", domain: "wsu.ac.kr", customDomain: "" })
          }
        } else {
          setApiError("사용자 정보를 불러오지 못했습니다.")
        }
      })
      .catch((error) => {
        setApiError(error.message || "API 호출 실패")
      })
  }, [router])

  // 비번, 이메일, 전화번호 수정 핸들러
  const handleEdit = useCallback(async (e) => {
    e.preventDefault()
    setEditMsg("")

    if (pw && pw !== pwConfirm) {
      setEditMsg("새 비밀번호가 일치하지 않습니다.")
      return
    }

    setLoading(true)
    try {
      const finalDomain = email.domain === "직접입력" ? email.customDomain.trim() : email.domain
      const finalEmail = `${email.id.trim()}@${finalDomain}`

      const res = await apiPut("/api/mypage-route", {
        id: user.id,
        pw: pw || undefined,
        phone: user.phone,
        email: finalEmail,
      });

      const data = await parseJsonResponse(res);
      
      if (data.success) {
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
  }, [user.id, user.phone, pw, pwConfirm, email, router])

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
      router.push("/login")
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
        router.push("/login")
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
          {/* EmailInput 컴포넌트 재사용 */}
          <EmailInput value={email} onChange={setEmail} styles={styles} />
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
