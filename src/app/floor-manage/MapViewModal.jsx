// 2D 도면 미리보기 및 수정 모달 컴포넌트
"use client"
import React from "react"
import ClipFileInput from "./ClipFileInput"
import styles from "./floor-manage.module.css"

export default function MapViewModal({
  mapModalOpen,
  mapModalFile,
  editMapBuilding,
  editMapFloor,
  editMapFile,
  editMapError,
  editMapLoading,
  selectedBuilding,
  editMapFileRef,
  onClose,
  onFileChange,
  onSubmit,
  getCacheBustedUrl,
  fetchFloors,
}) {
  if (!mapModalOpen) return null

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.mapModalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.mapModalCloseBtn}
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
        <div className={styles.mapModalTitle}>2D 도면 미리보기</div>
        <div className={styles.mapModalInfo}>
          <div className={styles.mapModalBuildingInfo}>
            건물명: {editMapBuilding} / 층수: {editMapFloor}
          </div>
        </div>
        {/* 도면 이미지 */}
        <object
          type="image/svg+xml"
          data={getCacheBustedUrl(mapModalFile)}
          className={styles.mapModalSvgObject}
        >
          SVG 미리보기를 지원하지 않는 브라우저입니다.
        </object>
        {/* 파일 선택 + 수정 버튼 */}
        <form className={styles.mapModalForm} onSubmit={onSubmit}>
          <div className={styles.fileInputContainer}>
            <ClipFileInput
              onFileChange={onFileChange}
              fileName={editMapFile ? editMapFile.name : ""}
              accept=".svg"
              fileInputRef={editMapFileRef}
            />
          </div>
          {editMapError && (
            <div className={styles.modalErrorText}>{editMapError}</div>
          )}
          <button
            type="submit"
            className={styles.mapModalSubmitBtn}
            disabled={editMapLoading}
          >
            {editMapLoading ? "수정 중..." : "도면 파일 수정"}
          </button>
        </form>
      </div>
    </div>
  )
}

