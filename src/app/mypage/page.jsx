"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import "./mypage.css"

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

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("id") : ""
    const name =
      typeof window !== "undefined" ? localStorage.getItem("name") : ""
    setUser((u) => ({ ...u, id: id || "", name: name || "" }))
    if (!id) return
    fetch(`/api/user-route?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser((u) => ({ ...u, ...data.user }))
      })
  }, [])

  const handleEdit = async (e) => {
    e.preventDefault()
    setEditMsg("")
    setLoading(true)
    try {
      const res = await fetch("/api/user-route", {
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
        setEditMsg(data.message || "회원정보가 수정되었습니다.")
        setPw("")
      } else {
        setEditMsg(data.error || "수정 실패")
      }
    } catch {
      setEditMsg("회원정보 수정 중 오류")
    }
    setLoading(false)
  }

  // 로그아웃
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("id")
      localStorage.removeItem("name")
    }
    fetch("/api/logout-route", { method: "POST" })
    window.location.href = "/login"
  }

  // 계정 삭제
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
    <div className="page-root">
      <aside className="sidebar">
        <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </aside>
      <main className="page-content">
        <div className="mypage-card">
          <h2 style={{ marginBottom: 24 }}>마이페이지</h2>
          <form onSubmit={handleEdit}>
            <div style={{ marginBottom: 16 }}>
              <label>아이디</label>
              <input
                value={user.id}
                disabled
                style={{ width: "100%", padding: 8, background: "#eee" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>이름</label>
              <input
                value={user.name}
                disabled
                style={{ width: "100%", padding: 8, background: "#eee" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>전화번호</label>
              <input
                value={user.phone || ""}
                onChange={(e) =>
                  setUser((u) => ({ ...u, phone: e.target.value }))
                }
                style={{ width: "100%", padding: 8 }}
                placeholder="전화번호"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>이메일</label>
              <input
                value={user.email || ""}
                onChange={(e) =>
                  setUser((u) => ({ ...u, email: e.target.value }))
                }
                style={{ width: "100%", padding: 8 }}
                placeholder="이메일"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>비밀번호 변경</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                placeholder="새 비밀번호(변경시만 입력)"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                background: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 6,
              }}
            >
              {loading ? "저장 중..." : "회원정보 수정"}
            </button>
          </form>
          {editMsg && (
            <div
              style={{
                marginTop: 16,
                color: editMsg.includes("수정") ? "green" : "red",
              }}
            >
              {editMsg}
            </div>
          )}
          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            style={{
              marginTop: 32,
              width: "100%",
              padding: 12,
              background: "#bbb",
              color: "#333",
              border: "none",
              borderRadius: 6,
            }}
          >
            로그아웃
          </button>
          {/* 계정 삭제 버튼 */}
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 12,
              background: "#ff4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
            }}
          >
            {deleting ? "계정 삭제 중..." : "계정 삭제"}
          </button>
          {deleteMsg && (
            <div style={{ marginTop: 12, color: "red" }}>{deleteMsg}</div>
          )}
        </div>
      </main>
    </div>
  )
}
