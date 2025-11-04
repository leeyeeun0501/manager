// 이미지 확대 모달 컴포넌트
"use client"
import React from "react"
import styles from "./building-manage.module.css"

export default function ImageZoomModal({ 
  imageModal, 
  currentImageArr, 
  onClose, 
  onNavigate 
}) {
  if (!imageModal.open || !currentImageArr || currentImageArr.length === 0) {
    return null
  }

  const currentImage = currentImageArr[imageModal.imageIndex]

  return (
    <div className={styles.imageZoomModal} onClick={onClose}>
      {/* 닫기 버튼 */}
      <button
        className={styles.imageZoomCloseButton}
        onClick={onClose}
      >
        ×
      </button>

      {/* 이전 버튼 */}
      {imageModal.totalImages > 1 && (
        <button
          className={`${styles.imageZoomNavButton} ${styles.imageZoomNavButtonPrev}`}
          onClick={(e) => {
            e.stopPropagation()
            onNavigate('prev')
          }}
        >
          ‹
        </button>
      )}

      {/* 다음 버튼 */}
      {imageModal.totalImages > 1 && (
        <button
          className={`${styles.imageZoomNavButton} ${styles.imageZoomNavButtonNext}`}
          onClick={(e) => {
            e.stopPropagation()
            onNavigate('next')
          }}
        >
          ›
        </button>
      )}

      {/* 이미지 */}
      <div
        className={styles.imageZoomContent}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`건물 사진 ${imageModal.imageIndex + 1}`}
          className={styles.imageZoomImg}
          onError={(e) => {
            e.target.src = "/fallback-image.jpg"
          }}
        />
      </div>

      {/* 이미지 인덱스 표시 */}
      {imageModal.totalImages > 1 && (
        <div className={styles.imageZoomIndex}>
          {imageModal.imageIndex + 1} / {imageModal.totalImages}
        </div>
      )}
    </div>
  )
}

