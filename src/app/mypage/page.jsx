// mypage
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import styles from "./mypage.module.css"

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
      const res = await fetch("/api/mypage-route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          pw: pw || undefined,
          phone: user.phone,
          email: user.email,
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
            onChange={(e) => setUser((u) => ({ ...u, phone: e.target.value }))}
            placeholder="전화번호"
          />
          <input
            className={styles["mypage-input"]}
            value={user.email || ""}
            onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))}
            placeholder="이메일"
          />
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
