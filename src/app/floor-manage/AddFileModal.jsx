// 2D 도면 파일 추가 모달 컴포넌트
"use client"
import React from "react"
import ClipFileInput from "./ClipFileInput"
import styles from "./floor-manage.module.css"

export default function AddFileModal({
  fileAddModal,
  addFile,
  addFileError,
  addFileLoading,
  onClose,
  onFileChange,
  onSubmit,
}) {
  if (!fileAddModal.open) return null

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalTitle}>2D 도면 파일 추가</div>
        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* 건물명/층수 표시 */}
          <div className={styles.modalBuildingInfo}>
            건물명: {fileAddModal.building} / 층수: {fileAddModal.floor}
          </div>
          {/* 파일 선택 */}
          <div className={styles.fileInputContainer}>
            <ClipFileInput
              onFileChange={onFileChange}
              fileName={addFile ? addFile.name : ""}
            />
          </div>
          {addFileError && (
            <div className={styles.modalErrorText}>{addFileError}</div>
          )}
          <div className={styles.modalActionButtons}>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.modalSubmitBtn}
              disabled={addFileLoading}
            >
              {addFileLoading ? "업로드 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

