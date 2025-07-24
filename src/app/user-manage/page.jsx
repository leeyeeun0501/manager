"use client"

import "../globals.css"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import { FaTrashAlt } from "react-icons/fa"
import "./user-manage.css"

export default function UserManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 페이징 관련
  const itemsPerPage = 20
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("USER_MANAGE_PAGE")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  // 페이징 - 사용자가 직접 이동 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("USER_MANAGE_PAGE", currentPage)
  }, [currentPage])

  // 현재 보여줄 페이지 범위의 user만 추출
  const totalUsers = users.length
  const totalPages = Math.ceil(totalUsers / itemsPerPage)

  const pagedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 사용자 전체 조회
  const fetchUsers = async (keepPage = false) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/user-route")
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "사용자 목록을 불러올 수 없습니다.")
      const usersArr = Array.isArray(data.users)
        ? data.users
        : Array.isArray(data)
        ? data
        : []
      // 생성일 내림차순(최신이 위로)
      usersArr.sort((a, b) => {
        const dateA = new Date(a.CreatedAt || a.createdAt || a.datetime || 0)
        const dateB = new Date(b.CreatedAt || b.createdAt || b.datetime || 0)
        return dateB - dateA
      })
      setUsers(usersArr)

      // ▲ 삭제 시 페이지가 전체 페이지 수보다 크면 마지막 페이지로 보정
      if (keepPage) {
        setCurrentPage((prev) => {
          const last = Math.max(1, Math.ceil(usersArr.length / itemsPerPage))
          return prev > last ? last : prev
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 최초 mount
  useEffect(() => {
    fetchUsers(true)
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
      await fetchUsers(true) // 🔸 삭제 후에도 페이지 정보 유지
    } catch (err) {
      alert(err.message)
    }
  }

  function formatDateTime(isoString) {
    if (!isoString) return ""
    const d = new Date(isoString)
    if (isNaN(d)) return ""
    const pad = (n) => n.toString().padStart(2, "0")
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    )
  }

  return (
    <div className="user-root">
      <span className="user-header">사용자 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="user-content">
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <>
            <table className="user-table center-table">
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>비밀번호</th>
                  <th>이름</th>
                  <th>학번</th>
                  <th>전화번호</th>
                  <th>이메일</th>
                  <th>생성일</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.length > 0 ? (
                  pagedUsers.map((user, idx) => (
                    <tr
                      key={
                        (user.Id || "") +
                        "-" +
                        (user.Email || "") +
                        "-" +
                        ((currentPage - 1) * itemsPerPage + idx)
                      }
                    >
                      <td>{user.Id || ""}</td>
                      <td>{user.Pw || ""}</td>
                      <td>{user.Name || ""}</td>
                      <td>{user.Stu_Num || ""}</td>
                      <td>{user.Phone || ""}</td>
                      <td>{user.Email || ""}</td>
                      <td>
                        {formatDateTime(
                          user.CreatedAt ||
                            user.createdAt ||
                            user.datetime ||
                            user.Created_At
                        )}
                      </td>
                      <td>
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
                    <td colSpan={8} style={{ textAlign: "center" }}>
                      사용자 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 페이징 */}
            <div className="user-pagination-row">
              <button
                className="user-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                이전
              </button>
              <span className="user-pagination-info">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                className="user-pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
