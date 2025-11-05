// 이미지 모달 컴포넌트
"use client"
import React from "react"
import Image from "next/image"
import styles from "./inquiry-manage.module.css"

export default function ImageModal({ isOpen, imageUrl, onClose }) {
  if (!isOpen || !imageUrl) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>문의 사진</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <Image
            src={imageUrl}
            alt="문의 사진"
            width={600}
            height={600}
            className={styles.modalImage}
          />
        </div>
      </div>
    </div>
  )
}

