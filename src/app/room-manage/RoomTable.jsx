import React from "react"
import { MdEditSquare } from "react-icons/md"

export default function RoomTable({
  pagedRooms,
  loading,
  error,
  currentPage,
  totalPages,
  setCurrentPage,
  setEditRoom,
  setEditRoomName,
  setEditRoomDesc,
  setEditRoomUsers,
  setEditRoomError,
  setShowEditRoomModal,
  styles, // styles 객체를 props로 전달받음
}) {
  const handleEditClick = (room) => {
    setEditRoom(room)
    setEditRoomName(room.name)
    setEditRoomDesc(room.description || "")
    setEditRoomUsers(
      Array.isArray(room.room_user)
        ? room.room_user.map((user, i) => ({
            user: user || "",
            phone: Array.isArray(room.user_phone)
              ? room.user_phone[i] || ""
              : room.user_phone || "",
            email: Array.isArray(room.user_email)
              ? room.user_email[i] || ""
              : room.user_email || "",
          }))
        : [
            {
              user: room.room_user || "",
              phone: room.user_phone || "",
              email: room.user_email || "",
            },
          ]
    )
    setEditRoomError("")
    setShowEditRoomModal(true)
  }

  return (
    <div className={styles["room-manage-table-wrap"]}>
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <>
          <table
            className={`${styles["user-table"]} ${styles["center-table"]} ${styles["bordered-table"]}`}
          >
            <thead>
              <tr>
                <th>건물명</th>
                <th>층</th>
                <th>강의실명</th>
                <th>강의실 설명</th>
                <th>사용자</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>수정</th>
              </tr>
            </thead>
            <tbody>
              {pagedRooms.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.noDataCell}>
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                pagedRooms.map((room, idx) => (
                  <tr
                    key={
                      room.building && room.floor && room.name
                        ? `${room.building}-${room.floor}-${room.name}`
                        : `row-${idx}`
                    }
                  >
                    <td>{room.building}</td>
                    <td>{room.floor}</td>
                    <td>{room.name}</td>
                    <td>{room.description}</td>
                    <td>
                      {Array.isArray(room.room_user)
                        ? room.room_user.filter((v) => v && v.trim()).length >
                          1
                          ? room.room_user.filter((v) => v && v.trim()).join(", ")
                          : room.room_user.find((v) => v && v.trim()) || ""
                        : room.room_user && room.room_user.trim()
                        ? room.room_user
                        : ""}
                    </td>
                    <td>
                      {Array.isArray(room.user_phone)
                        ? room.user_phone.filter((v) => v && v.trim()).length >
                          1
                          ? room.user_phone.filter((v) => v && v.trim()).join(", ")
                          : room.user_phone.find((v) => v && v.trim()) || ""
                        : room.user_phone && room.user_phone.trim()
                        ? room.user_phone
                        : ""}
                    </td>
                    <td>
                      {Array.isArray(room.user_email)
                        ? room.user_email.filter((v) => v && v.trim()).length >
                          1
                          ? room.user_email.filter((v) => v && v.trim()).join(", ")
                          : room.user_email.find((v) => v && v.trim()) || ""
                        : room.user_email && room.user_email.trim()
                        ? room.user_email
                        : ""}
                    </td>
                    <td>
                      <button
                        className={styles.editIconButton}
                        onClick={() => handleEditClick(room)}
                      >
                        <MdEditSquare size={20} color="#007bff" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* 페이지네이션 */}
          <div className={styles["room-manage-pagination-row"]}>
            <button
              className={styles["room-manage-pagination-btn"]}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <span className={styles["room-manage-pagination-info"]}>
              {currentPage} / {totalPages}
            </span>
            <button
              className={styles["room-manage-pagination-btn"]}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages || totalPages === 0}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  )
}