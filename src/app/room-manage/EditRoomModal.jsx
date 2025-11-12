// 강의실 정보 수정 모달
"use client"
import React, { useCallback } from "react"

export default function EditRoomModal({
  show,
  onClose,
  editRoom,
  editRoomName,
  editRoomDesc,
  setEditRoomDesc,
  editRoomUsers,
  setEditRoomUsers,
  editRoomError,
  onSave,
  styles,
}) {
  const handleUserChange = useCallback((index, field, value) => {
    setEditRoomUsers((prev) => {
      const arr = [...prev]
      arr[index][field] = value
      return arr
    })
  }, [setEditRoomUsers])

  const handleAddUser = useCallback(() => {
    setEditRoomUsers((prev) => [...prev, { user: "", phone: "", email: "" }])
  }, [setEditRoomUsers])

  const handleDeleteUser = useCallback((index) => {
    if (editRoomUsers.length === 1) return
    setEditRoomUsers((prev) => prev.filter((_, idx) => idx !== index))
  }, [editRoomUsers.length, setEditRoomUsers])

  if (!show || !editRoom) return null

  return (
    <div className={styles.editRoomModalOverlay} onClick={onClose}>
      <div
        className={styles.editRoomModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.editRoomModalHeader}>
          <h4 className={styles.editRoomModalTitle}>강의실 전체 정보 수정</h4>
        </div>
        <div className={styles.editRoomModalInfo}>
          {`건물명: ${editRoom?.building} / 층수: ${editRoom?.floor} / 호수: ${editRoom?.name}`}
        </div>
        <input
          value={editRoomDesc}
          onChange={(e) => setEditRoomDesc(e.target.value)}
          placeholder="강의실 설명"
          className={styles.editRoomModalInput}
        />
        {editRoomUsers.map((item, i) => (
          <div key={i} className={styles.editRoomModalUserRow}>
            <input
              value={item.user}
              onChange={(e) => handleUserChange(i, "user", e.target.value)}
              placeholder={`사용자${editRoomUsers.length > 1 ? ` ${i + 1}` : ""}`}
              className={styles.editRoomModalUserInput}
            />
            <input
              value={item.phone}
              onChange={(e) => handleUserChange(i, "phone", e.target.value)}
              placeholder="전화번호"
              className={styles.editRoomModalUserInput}
            />
            <input
              value={item.email}
              onChange={(e) => handleUserChange(i, "email", e.target.value)}
              placeholder="이메일"
              className={styles.editRoomModalUserInput}
            />
            <button
              onClick={() => handleDeleteUser(i)}
              className={styles.editRoomModalDeleteUserButton}
              title="삭제"
              type="button"
            >
              －
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddUser}
          className={styles.editRoomModalAddUserButton}
        >
          + 사용자 추가
        </button>
        {editRoomError && (
          <div className={styles.editRoomModalError}>{editRoomError}</div>
        )}
        <div className={styles.editRoomModalActions}>
          <button
            onClick={onClose}
            className={styles.editRoomModalButton}
            type="button"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className={`${styles.editRoomModalButton} ${styles.editRoomModalPrimaryButton}`}
            type="button"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

