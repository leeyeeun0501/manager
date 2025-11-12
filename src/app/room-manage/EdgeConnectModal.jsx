// 엣지 연결 안내 모달
"use client"
import React from "react"

export default function EdgeConnectModal({
  show,
  onClose,
  filterBuilding,
  filterFloor,
  edgeFromNode,
  styles,
}) {
  if (!show || !edgeFromNode) return null

  return (
    <div className={styles.edgeConnectModalOverlay}>
      <div className={styles.edgeConnectModalContent}>
        <h3 className={styles.edgeConnectModalTitle}>엣지 연결</h3>
        <div className={styles.edgeConnectModalText}>
          {filterBuilding} {filterFloor} {edgeFromNode.id}에서 연결할 노드를
          선택하세요.
        </div>
        <div className={styles.edgeConnectModalHighlight}>
          지도에서 <b>다른 노드</b>를 클릭하세요.
        </div>
        <button
          className={styles.edgeConnectModalButton}
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  )
}

