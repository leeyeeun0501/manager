// 노드/건물 관리 모달 컴포넌트
"use client"
import React from "react"
import ImageGallery from "./ImageGallery"
import styles from "./building-manage.module.css"

export default function ManageNodeModal({
  deletePopup,
  buildingDesc,
  buildingDescLoading,
  currentImageArr,
  selectedImages,
  newBuildingImages,
  connectedNodes,
  onBuildingDescChange,
  onToggleImageSelection,
  onImageDoubleClick,
  onDeleteSelectedImages,
  onAddImage,
  onRemoveNewImage,
  onClearAllNewImages,
  onUpdateBuildingDesc,
  onEdgeDisconnect,
  onStartEdgeConnect,
  onDeleteNode,
  onClose,
}) {
  if (!deletePopup.open) return null

  const isBuilding = deletePopup.type === "building"

  return (
    <div className={styles.modalPopup}>
      {/* 상단 타이틀 */}
      <div className={styles.modalTitle}>
        노드/건물 관리
      </div>
      
      {/* 관리 섹션 */}
      <div className={styles.manageSection}>
        <div className={styles.manageInfo}>
          <strong>이름:</strong> {deletePopup.node_name} <br />
          <span>
            <strong>위도(x):</strong> {deletePopup.x}&nbsp;&nbsp;
            <strong>경도(y):</strong> {deletePopup.y}
          </span>
        </div>

        {/* 건물일 때만 이미지 갤러리 및 설명 입력란 */}
        {isBuilding && (
          <>
            <ImageGallery
              currentImageArr={currentImageArr}
              selectedImages={selectedImages}
              newBuildingImages={newBuildingImages}
              onToggleSelection={onToggleImageSelection}
              onImageDoubleClick={onImageDoubleClick}
              onDeleteSelected={onDeleteSelectedImages}
              onAddImage={onAddImage}
              onRemoveNewImage={onRemoveNewImage}
              onClearAllNewImages={onClearAllNewImages}
            />

            {/* 설명 입력란 */}
            <textarea
              className={styles.textarea}
              value={buildingDesc}
              onChange={(e) => onBuildingDescChange(e.target.value)}
              placeholder="설명"
            />
          </>
        )}

        {/* 연결된 노드 (엣지 해제) */}
        <div className={styles.connectedNodesSection}>
          <div className={styles.connectedNodesTitle}>
            연결된 노드
          </div>
          {connectedNodes.length === 0 ? (
            <div className={styles.noConnectedNodes}>
              연결된 노드 없음
            </div>
          ) : (
            connectedNodes.map((connectedNode) => (
              <button
                key={connectedNode}
                type="button"
                className={styles.buttonWarning}
                onClick={() => onEdgeDisconnect(deletePopup.node_name, connectedNode)}
              >
                {connectedNode} 엣지 연결 해제
              </button>
            ))
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className={styles.buttonGroupBottom}>
          <button
            type="button"
            className={`${styles.buttonFull} ${styles.buttonCancel}`}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className={`${styles.buttonFull} ${styles.buttonDanger}`}
            onClick={onDeleteNode}
          >
            삭제
          </button>
          <button
            type="button"
            className={`${styles.buttonFull} ${styles.buttonPrimary}`}
            onClick={() => onStartEdgeConnect(deletePopup)}
          >
            엣지 연결
          </button>
          {isBuilding && (
            <button
              type="button"
              disabled={buildingDescLoading}
              className={`${styles.buttonFull} ${styles.buttonPrimary}`}
              onClick={onUpdateBuildingDesc}
            >
              {buildingDescLoading ? "수정 중..." : "수정"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

