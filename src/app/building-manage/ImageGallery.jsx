// 이미지 갤러리 컴포넌트
"use client"
import React from "react"
import styles from "./building-manage.module.css"

export default function ImageGallery({
  currentImageArr,
  selectedImages,
  newBuildingImages,
  onToggleSelection,
  onImageDoubleClick,
  onDeleteSelected,
  onAddImage,
  onRemoveNewImage,
  onClearAllNewImages,
}) {
  return (
    <>
      {/* 이미지 갤러리 헤더 */}
      <div className={styles.imageGalleryHeader}>
        <div className={styles.imageGalleryTitle}>
          <strong>현재 건물 사진</strong>
        </div>
        <div className={styles.imageGalleryActions}>
          {selectedImages.length > 0 && (
            <button
              className={`${styles.imageActionButton} ${styles.imageActionButtonDelete}`}
              onClick={onDeleteSelected}
              title="선택한 이미지 삭제"
            >
              <svg
                viewBox="64 64 896 896"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z" />
              </svg>
            </button>
          )}
          <label
            className={`${styles.imageActionButton} ${styles.imageActionButtonAdd}`}
            title="이미지 추가"
          >
            <svg
              viewBox="64 64 896 896"
              width="20"
              height="20"
              fill="currentColor"
            >
              <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z" />
              <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z" />
            </svg>
            <input
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenInput}
              onChange={onAddImage}
            />
          </label>
        </div>
      </div>

      {/* 이미지 그리드 */}
      <div className={styles.imageGrid}>
        {currentImageArr.map((imageUrl, idx) => (
          <div
            key={`existing-${imageUrl}-${idx}`}
            className={`${styles.imageItem} ${selectedImages.includes(imageUrl) ? styles.imageItemSelected : ""}`}
            onClick={() => onToggleSelection(imageUrl)}
            onDoubleClick={() => onImageDoubleClick(imageUrl, idx, currentImageArr.length)}
          >
            <img
              src={imageUrl}
              alt={`건물 사진 ${idx + 1}`}
              className={styles.imageItemImg}
              onError={(e) => {
                e.target.src = "/fallback-image.jpg"
              }}
            />
            {selectedImages.includes(imageUrl) && (
              <div className={styles.imageItemCheck}>
                ✓
              </div>
            )}
          </div>
        ))}

        {/* 이미지가 없을 때 표시 */}
        {currentImageArr.length === 0 && newBuildingImages.length === 0 && (
          <div className={styles.noImagesMessage}>
            사진 없음
          </div>
        )}
      </div>

      {/* 새로 추가된 이미지들 */}
      {newBuildingImages.length > 0 && (
        <div className={styles.newImagesSection}>
          <div className={styles.selectedFilesTitle}>
            선택된 파일
          </div>
          <div className={styles.selectedFilesList}>
            {newBuildingImages.map((file, index) => (
              <div key={index} className={styles.fileItem}>
                <span className={styles.fileName}>
                  {file.name}
                </span>
                <button
                  className={styles.deleteFileButton}
                  onClick={() => onRemoveNewImage(index)}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {newBuildingImages.length > 0 && (
            <button
              type="button"
              className={styles.clearAllFilesButton}
              onClick={onClearAllNewImages}
            >
              모든 파일 제거
            </button>
          )}
        </div>
      )}
    </>
  )
}

