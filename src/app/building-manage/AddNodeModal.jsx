// 노드/건물 추가 모달 컴포넌트
"use client"
import React from "react"
import styles from "./building-manage.module.css"

export default function AddNodeModal({
  addPopup,
  type,
  nodeName,
  desc,
  newBuildingImages,
  nextONodeName,
  onTypeChange,
  onNodeNameChange,
  onDescChange,
  onFileSelect,
  onRemoveFile,
  onClearAllFiles,
  onSubmit,
  onClose,
}) {
  if (!addPopup.open) return null

  return (
    <div className={styles.modalPopup}>
      {/* 상단 타이틀 */}
      <div className={styles.modalTitle}>
        노드/건물 추가
      </div>
      
      {/* 추가 폼 */}
      <form className={styles.form} onSubmit={onSubmit}>
        {/* 라디오 박스 */}
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="type"
              value="building"
              checked={type === "building"}
              onChange={() => onTypeChange("building")}
            />{" "}
            건물
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="node"
              checked={type === "node"}
              onChange={() => onTypeChange("node")}
            />{" "}
            노드
          </label>
        </div>

        {/* 위도/경도 정보 */}
        <div className={styles.coordinateInfo}>
          <span>
            <strong>위도(x):</strong> {addPopup.x} &nbsp;&nbsp;
            <strong>경도(y):</strong> {addPopup.y}
          </span>
          {/* 물음표 툴팁 */}
          <span className={styles.tooltipTrigger} tabIndex={0}>
            <span className={styles.tooltipIcon}>?</span>
            <span className={`${styles.tooltip} latlng-tooltip`}>
              위도(x)는 남북 위치(가로줄), 경도(y)는 동서 위치(세로줄)를 의미합니다.
              <br />
              지도에서 클릭한 지점의 좌표가 자동으로 입력됩니다.
            </span>
          </span>
        </div>

        {/* 건물 입력란 */}
        {type === "building" && (
          <>
            <input
              className={styles.input}
              type="text"
              value={nodeName}
              onChange={(e) => onNodeNameChange(e.target.value)}
              placeholder="이름"
              required
            />
            <textarea
              className={styles.textarea}
              value={desc}
              onChange={(e) => onDescChange(e.target.value)}
              placeholder="설명"
              rows={3}
            />
            {/* 이미지 업로드 필드 */}
            <div className={styles.fileUploadSection}>
              <button
                type="button"
                className={styles.addFileButton}
                onClick={() => document.getElementById("add-file-input").click()}
              >
                <span className={styles.addFileButtonIcon}>+</span> 파일 추가
              </button>

              <input
                id="add-file-input"
                type="file"
                accept="image/*"
                multiple
                className={styles.hiddenInput}
                onChange={onFileSelect}
              />

              {newBuildingImages.length > 0 && (
                <div className={styles.selectedFilesContainer}>
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
                          type="button"
                          className={styles.deleteFileButton}
                          onClick={() => onRemoveFile(index)}
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.clearAllFilesButton}
                    onClick={onClearAllFiles}
                  >
                    모든 파일 제거
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* 노드 정보 */}
        {type === "node" && (
          <div className={styles.nodeInfo}>
            <strong>자동 생성 노드명:</strong> {nextONodeName}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonCancel}`}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}

