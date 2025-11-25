// 사용자 관리 페이지
"use client"
import "../globals.css"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import { FaTrashAlt } from "react-icons/fa"
import LoadingOverlay from "../components/loadingoverlay"
import styles from "./user-manage.module.css"
import { apiGet, apiDelete, parseJsonResponse, extractUserListData, formatDateTime } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"
import { useToast } from "../utils/useToast"
import { usePagination } from "../utils/usePagination"
import { useSearchFilter } from "../utils/useSearchFilter"

export default function UserManagePage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 토스트 메시지 훅
  const { toastMessage, toastVisible, showToast } = useToast()

  // 검색 필터링 훅
  const { search, setSearch, filteredData: filteredUsers } = useSearchFilter(users)

  // 페이징 훅
  const itemsPerPage = 20
  const { currentPage, totalPages, pagedData: pagedUsers, goToPrevPage, goToNextPage } = usePagination(
    filteredUsers,
    itemsPerPage,
    "USER_MANAGE_PAGE"
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

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 최초 mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // 사용자 삭제 핸들러
  const handleDelete = async (id) => {
    if (!confirm("정말로 사용자를 삭제하시겠습니까?")) return
    try {
      const res = await apiDelete("/api/user-route", { id })
      const data = await parseJsonResponse(res)
      if (!data.success) throw new Error(data.error || "삭제 실패")
      showToast("사용자가 삭제되었습니다.")
      await fetchUsers()
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

          <div className={styles["room-manage-table-wrap"]}>
            <table className={`${styles["user-table"]} ${styles["center-table"]} ${styles["bordered-table"]}`}>
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
                    {loading ? "데이터를 불러오는 중입니다..." : (error ? error : "사용자 데이터가 없습니다.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* 페이징 */}
          <div className={styles["room-manage-pagination-row"]}>
            <button
              className={styles["room-manage-pagination-btn"]}
              disabled={currentPage === 1}
              onClick={goToPrevPage}
            >
              이전
            </button>
            <span className={styles["room-manage-pagination-info"]}>
              {currentPage} / {totalPages}
            </span>
            <button
              className={styles["room-manage-pagination-btn"]}
              disabled={currentPage >= totalPages}
              onClick={goToNextPage}
            >
              다음
            </button>
          </div>
        </>
      </div>
    </div>
  )
}
