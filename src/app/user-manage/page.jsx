"use client"
import React, { useState } from "react"
import Menu from "../components/menu"
import { FaTrashAlt } from "react-icons/fa"
import "./user-manage.css"

export default function UserManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  // 임시 사용자 데이터
  const [users, setUsers] = useState([
    {
      id: "test1",
      pw: "pw1",
      name: "홍길동",
      stu_num: "20240001",
      phone: "010-1234-5678",
      email: "test1@example.com",
    },
    {
      id: "test2",
      pw: "pw2",
      name: "김철수",
      stu_num: "20240002",
      phone: "010-2345-6789",
      email: "test2@example.com",
    },
    {
      id: "test3",
      pw: "pw3",
      name: "이영희",
      stu_num: "20240003",
      phone: "010-3456-7890",
      email: "test3@example.com",
    },
  ])
  const [loading, setLoading] = useState(false)

  // 삭제 핸들러
  const handleDelete = (id) => {
    if (!confirm("정말로 사용자를 삭제하시겠습니까?")) return
    setUsers(users.filter((user) => user.id !== id))
    alert("사용자가 삭제되었습니다.")
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="management-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="management-content">
        <h2 className="management-title">사용자 관리</h2>
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>비밀번호</th>
              <th>이름</th>
              <th>학번</th>
              <th>전화번호</th>
              <th>이메일</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.pw}</td>
                  <td>{user.name}</td>
                  <td>{user.stu_num}</td>
                  <td>{user.phone}</td>
                  <td className="email-trash-cell">
                    <span>{user.email}</span>
                    <button
                      className="trash-btn"
                      onClick={() => handleDelete(user.id)}
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
      </div>
    </div>
  )
}
