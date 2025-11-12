// 계단 연결 모달
"use client"
import React, { useMemo, useCallback } from "react"

export default function StairsModal({
  show,
  onClose,
  stairsLoading,
  stairsError,
  stairsList,
  stairsNodes,
  selectedStairsNode,
  targetStairId,
  setTargetStairId,
  onConnect,
  parseNodeInfo,
  styles,
}) {
  const filteredStairsList = useMemo(() => {
    return stairsList.filter((id) => id !== (selectedStairsNode?.id || ""))
  }, [stairsList, selectedStairsNode?.id])

  const nodeDisplayName = useCallback((name) => {
    if (!name) return ""
    const parts = name.split("@")
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
  }, [])

  if (!show) return null

  return (
    <div className={styles.stairsModalOverlay} onClick={onClose}>
      <div
        className={styles.stairsModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.stairsModalHeader}>
          <h4 className={styles.stairsModalTitle}>다른 층 계단 연결</h4>
        </div>

        <div className={styles.stairsModalBody}>
          {stairsLoading ? (
            <div className={styles.stairsModalLoading}>
              계단 목록을 불러오는 중...
            </div>
          ) : stairsError ? (
            <div className={styles.stairsModalError}>{stairsError}</div>
          ) : (
            <>
              <select
                value={targetStairId || ""}
                onChange={(e) => setTargetStairId(e.target.value)}
                className={styles.stairsModalSelect}
              >
                <option value="">연결할 계단 선택</option>
                {filteredStairsList.map((id) => {
                  const parts = id.split("@")
                  const floor = parts[1] || ""
                  const stairName = parts[2] || ""
                  return (
                    <option key={id} value={id}>
                      {floor}층 - {stairName}
                    </option>
                  )
                })}
              </select>
              {stairsNodes.length > 0 && (
                <div className={styles.stairsModalList}>
                  <strong>연결된 계단 목록</strong>
                  <ul>
                    {stairsNodes.map((node) => (
                      <li key={node.id} className={styles.stairsModalListItem}>
                        {node.floor}층 - {nodeDisplayName(node.name || node.id)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.stairsModalActions}>
          <button
            className={styles.stairsModalButton}
            onClick={onClose}
          >
            취소
          </button>
          <button
            onClick={onConnect}
            disabled={!targetStairId}
            className={`${styles.stairsModalButton} ${styles.stairsModalPrimaryButton}`}
          >
            엣지 연결
          </button>
        </div>
      </div>
    </div>
  )
}

