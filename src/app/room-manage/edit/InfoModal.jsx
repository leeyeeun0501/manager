// 정보 모달
"use client"
import React from "react"
import styles from "../room-manage.module.css"

export default function InfoModal({
  show,
  onClose,
  selectedInfo,
  onDelete,
}) {
  if (!show || !selectedInfo) return null

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["node-modal-content"]} onClick={(e) => e.stopPropagation()}>
        {/* 제목 */}
        <div className={styles["node-modal-title"]}>
          <h3>{selectedInfo.type === 'node' ? '노드 정보' : '카테고리 정보'}</h3>
          <div className={styles["title-underline"]}></div>
        </div>

        {/* 정보 표시 */}
        <div className={styles["input-fields"]}>
          <div className={styles.infoModalFieldWrapper}>
            <label className={styles.infoModalFieldLabel}>
              {selectedInfo.type === 'node' ? '노드명' : '카테고리명'}
            </label>
            <div className={styles.infoModalFieldValue}>
              {selectedInfo.name}
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className={styles["modal-actions"]}>
          <button
            onClick={() => {
              onDelete(selectedInfo)
              onClose()
            }}
            className={styles.infoModalDeleteButton}
          >
            삭제
          </button>
          <button onClick={onClose} className={styles["cancel-btn"]}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

