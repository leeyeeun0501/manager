// 층 추가 모달 컴포넌트
"use client"
import React, { useRef } from "react"
import ClipFileInput from "./ClipFileInput"
import styles from "./floor-manage.module.css"

export default function AddFloorModal({
  showAddFloor,
  addFloorBuilding,
  addFloorNum,
  addFloorFile,
  addFloorError,
  buildingOptions,
  floorList,
  currentFloorIndex,
  onClose,
  onBuildingChange,
  onFloorUp,
  onFloorDown,
  onFileChange,
  onSubmit,
}) {
  const addFloorFileRef = useRef(null)

  if (!showAddFloor) return null

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalTitle}>층 추가</div>
        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <select
            value={addFloorBuilding}
            onChange={(e) => onBuildingChange(e.target.value)}
            required
            className={styles.modalSelect}
          >
            <option value="">건물 선택</option>
            {buildingOptions.map((b, idx) => (
              <option key={b || idx} value={b}>
                {b}
              </option>
            ))}
          </select>
          {/* 층 선택: 화살표 방식 */}
          <div className={styles.floorSelector}>
            <input
              type="text"
              value={addFloorNum}
              readOnly
              required
              className={styles.floorSelectorInput}
            />
            <div className={styles.floorSelectorButtons}>
              <button
                type="button"
                onClick={onFloorUp}
                className={styles.floorArrowBtn}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={onFloorDown}
                className={styles.floorArrowBtn}
              >
                ▼
              </button>
            </div>
          </div>
          <div className={styles.fileInputContainer}>
            <ClipFileInput
              onFileChange={onFileChange}
              fileName={addFloorFile ? addFloorFile.name : ""}
              fileInputRef={addFloorFileRef}
            />
          </div>
          {addFloorError && (
            <div className={styles.modalErrorText}>{addFloorError}</div>
          )}
          <div className={styles.modalActionButtons}>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={onClose}
            >
              취소
            </button>
            <button type="submit" className={styles.modalSubmitBtn}>
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

