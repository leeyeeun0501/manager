// 카테고리 추가 모달
"use client"
import React from "react"
import styles from "../room-manage.module.css"

export default function CategoryModal({
  show,
  onClose,
  selectedCategory,
  setSelectedCategory,
  categoryOptions,
  onAdd,
}) {
  if (!show) return null

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["node-modal-content"]} onClick={(e) => e.stopPropagation()}>
        {/* 제목 */}
        <div className={styles["node-modal-title"]}>
          <h3>카테고리 추가</h3>
          <div className={styles["title-underline"]}></div>
        </div>

        {/* 카테고리 선택 */}
        <div className={styles["input-fields"]}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles["category-select"]}
          >
            <option value="">카테고리를 선택하세요</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 액션 버튼들 */}
        <div className={styles["modal-actions"]}>
          <button onClick={onClose} className={styles["cancel-btn"]}>
            취소
          </button>
          <button onClick={onAdd} className={styles["save-btn"]}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

