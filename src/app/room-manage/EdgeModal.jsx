// 노드 정보 모달
"use client"
import React, { useMemo } from "react"

export default function EdgeModal({
  show,
  onClose,
  edgeModalNode,
  connectedNodes,
  onDisconnectEdge,
  onConnectEdge,
  onOpenStairsModal,
  styles,
}) {
  const nodeIdDisplay = useMemo(() => {
    if (!edgeModalNode?.id) return ""
    const parts = edgeModalNode.id.split("@")
    const lastPart = parts[parts.length - 1]
    if (
      lastPart.toLowerCase().startsWith("b") ||
      lastPart.toLowerCase().includes("stairs")
    ) {
      return lastPart
    }
    if (/^\d+$/.test(lastPart)) {
      return `${lastPart}호`
    }
    return lastPart
  }, [edgeModalNode?.id])

  const isStairsNode = useMemo(() => {
    return (
      edgeModalNode?.id?.toLowerCase().includes("stairs") ||
      edgeModalNode?.id?.toLowerCase().includes("to")
    )
  }, [edgeModalNode?.id])

  if (!show || !edgeModalNode) return null

  return (
    <div className={styles.edgeModalOverlay} onClick={onClose}>
      <div
        className={styles.edgeModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.edgeModalHeader}>
          <h4 className={styles.edgeModalTitle}>노드 정보</h4>
        </div>
        <div className={styles.edgeModalBody}>
          <div className={styles.edgeModalInfoItem}>
            <strong className={styles.edgeModalInfoLabel}>건물:</strong>
            <span className={styles.edgeModalInfoValue}>
              {edgeModalNode.building}
            </span>
          </div>
          <div className={styles.edgeModalInfoItem}>
            <strong className={styles.edgeModalInfoLabel}>층:</strong>
            <span className={styles.edgeModalInfoValue}>
              {edgeModalNode.floor}
            </span>
          </div>
          <div className={styles.edgeModalInfoItem}>
            <strong className={styles.edgeModalInfoLabel}>ID:</strong>
            <span className={styles.edgeModalInfoValue}>{nodeIdDisplay}</span>
          </div>
          {/* 연결된 노드 목록 */}
          <div className={styles.edgeModalConnectedNodes}>
            <strong>연결된 노드</strong>
            {connectedNodes.length === 0 ? (
              <div className={styles.edgeModalNoNodes}>연결된 노드 없음</div>
            ) : (
              connectedNodes.map((edge, idx) => {
                const parts = edge.otherNodeId.split("@")
                const floor = parts[1] || ""
                const suffix = edge.otherNodeSuffix || parts[2] || ""

                let labelText = ""
                if (suffix.toLowerCase().includes("stairs")) {
                  labelText = `${floor}층 ${suffix} 엣지 연결 해제`
                } else if (suffix.toLowerCase().startsWith("b")) {
                  labelText = `${suffix} 엣지 연결 해제`
                } else if (/^\d+$/.test(suffix)) {
                  labelText = `${suffix}호 엣지 연결 해제`
                } else {
                  labelText = `${suffix} 엣지 연결 해제`
                }

                return (
                  <button
                    key={`${edge.otherNodeId}-${idx}`}
                    onClick={() => onDisconnectEdge(edge.otherNodeId)}
                    className={styles.edgeModalConnectedNodeItem}
                  >
                    {labelText}
                  </button>
                )
              })
            )}
          </div>
        </div>
        <div className={styles.edgeModalActions}>
          <button onClick={onClose} className={styles.edgeModalButton}>
            취소
          </button>
          <button
            onClick={onConnectEdge}
            className={`${styles.edgeModalButton} ${styles.edgeModalPrimaryButton}`}
          >
            엣지 연결
          </button>
          {isStairsNode && (
            <button
              onClick={onOpenStairsModal}
              className={`${styles.edgeModalButton} ${styles.edgeModalStairsButton}`}
            >
              다른 층으로 이동
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

