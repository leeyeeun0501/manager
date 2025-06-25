"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import { FaTrashAlt } from "react-icons/fa"
import "./user-manage.css"

export default function UserManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 사용자 전체 조회
  const fetchUsers = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/user-route")
      const data = await res.json()
      console.log("서버 응답:", data) // 실제 응답 구조 확인!
      if (!res.ok)
        throw new Error(data.error || "사용자 목록을 불러올 수 없습니다.")
      // 배열 구조 대응 (users: [...]) 또는 그냥 배열
      const usersArr = Array.isArray(data.users)
        ? data.users
        : Array.isArray(data)
        ? data
        : []
      setUsers(usersArr)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 삭제 핸들러
  const handleDelete = async (id) => {
    if (!confirm("정말로 사용자를 삭제하시겠습니까?")) return
    try {
      const res = await fetch("/api/user-route", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "삭제 실패")
      alert("사용자가 삭제되었습니다.")
      fetchUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="management-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="management-content">
        <h2 className="management-title">사용자 관리</h2>
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>비밀번호</th>
                <th>이름</th>
                <th>학번</th>
                <th>전화번호</th>
                <th>이메일/삭제</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, idx) => (
                  <tr key={user.Id || user.Email || idx}>
                    <td>{user.Id || ""}</td>
                    <td>{user.Pw || ""}</td>
                    <td>{user.Name || ""}</td>
                    <td>{user.Stu_Num || ""}</td>
                    <td>{user.Phone || ""}</td>
                    <td className="email-trash-cell">
                      <span>{user.Email || ""}</span>
                      <button
                        className="trash-btn"
                        onClick={() => handleDelete(user.Id)}
                        title="삭제"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    사용자 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
