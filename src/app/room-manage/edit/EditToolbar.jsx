// 편집 툴바
"use client"
import React from "react"
import styles from "../room-manage.module.css"

export default function EditToolbar({ onAddNode, onAddCategory }) {
  return (
    <div className={styles["edit-toolbar"]}>
      <button
        onClick={onAddNode}
        className={`${styles["toolbar-btn"]} ${styles["node-btn"]}`}
        title="노드 추가"
      >
        <div className={styles["toolbar-circle"]}></div>
      </button>
      <button
        onClick={onAddCategory}
        className={`${styles["toolbar-btn"]} ${styles["category-btn"]}`}
        title="카테고리 추가"
      >
        <div className={styles["toolbar-circle"]}></div>
      </button>
    </div>
  )
}

