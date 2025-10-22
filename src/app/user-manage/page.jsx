// 사용자 관리 페이지
"use client"
import "../globals.css"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import { FaTrashAlt } from "react-icons/fa"
import LoadingOverlay from "../components/loadingoverlay"
import styles from "./user-manage.module.css"
import { apiGet, apiDelete, parseJsonResponse, extractUserListData } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"

function formatDateTime(isoString) {
  if (!isoString) return ""
  const d = new Date(isoString)
  if (isNaN(d)) return ""
  const pad = (n) => n.toString().padStart(2, "0")
  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  )
}

export default function UserManagePage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filteredUsers, setFilteredUsers] = useState([])

  // 페이징 관련
  const itemsPerPage = 20
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("USER_MANAGE_PAGE")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  // 팝업 메시지 상태
  const [toastMessage, setToastMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), duration)
  }

  // 현재 보여줄 페이지 범위의 user만 추출 (검색된 결과 기준)
  const totalUsers = filteredUsers.length
  const totalPages = Math.ceil(totalUsers / itemsPerPage)

  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 사용자 전체 조회
  const fetchUsers = async (keepPage = false) => {
    setLoading(true)
    setError("")
    try {
      const res = await apiGet("/api/user-route")
      const data = await parseJsonResponse(res)
      
      const usersArr = extractUserListData(data)
      // 생성일 내림차순(최신이 위로)
      usersArr.sort((a, b) => {
        const dateA = new Date(a.CreatedAt || a.createdAt || a.datetime || 0)
        const dateB = new Date(b.CreatedAt || b.createdAt || b.datetime || 0)
        return dateB - dateA
      })
      setUsers(usersArr)

      // 삭제 시 페이지가 전체 페이지 수보다 크면 마지막 페이지로 보정
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

  // 검색 필터링
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users)
      setCurrentPage(1)
      return
    }
    const keyword = search.toLowerCase()
    const filtered = users.filter((user) =>
      Object.values(user).some((val) =>
        (val ?? "").toString().toLowerCase().includes(keyword)
      )
    )
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [search, users])

  // 페이징
  useEffect(() => {
    localStorage.setItem("USER_MANAGE_PAGE", currentPage)
  }, [currentPage])

  // 사용자 삭제 핸들러
  const handleDelete = async (id) => {
    if (!confirm("정말로 사용자를 삭제하시겠습니까?")) return
    try {
      const res = await apiDelete("/api/user-route", { id })
      const data = await parseJsonResponse(res)
      if (!data.success) throw new Error(data.error || "삭제 실패")
      showToast("사용자가 삭제되었습니다.")
      await fetchUsers(true)
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <div className={styles.userRoot}>
      {loading && <LoadingOverlay />}
      {/* 토스트 메시지 UI */}
      {toastVisible && (
        <div className={styles.toastPopup}>
          {toastMessage}
        </div>
      )}
      <span className={styles.userHeader}>사용자 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles.userContent}>
        {error ? (
          <div className={styles.errorText}>{error}</div>
        ) : (
          <>
            {/* 검색 입력 */}
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles["search-input"]}
              />
            </div>

            <div className={styles.tableWrapper}>
              <table className={`${styles.userTable} ${styles.centerTable}`}>
              <thead>
                <tr>
                  <th>아이디</th>
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
                          className={styles.trashBtn}
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
                    <td colSpan={7} className={styles.noData}>
                      사용자 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {/* 페이징 */}
            <div className={styles.userPaginationRow}>
              <button
                className={styles.userPaginationBtn}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                이전
              </button>
              <span className={styles.userPaginationInfo}>
                {currentPage} / {totalPages || 1}
              </span>
              <button
                className={styles.userPaginationBtn}
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
