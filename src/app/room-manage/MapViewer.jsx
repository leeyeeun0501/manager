// 강의실 관리 페이지 지도 부분
import React, { useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"

const CANVAS_SIZE = 600

export default function MapViewer({
  mapLoading,
  filterBuilding,
  filterFloor,
  svgRaw,
  svgViewBox,
  svgNodes,
  edges,
  selectedNode,
  onNodeClick,
  parseNodeInfo,
  styles,
}) {
  const router = useRouter()
  const mapContainerRef = useRef(null)

  const handleEditClick = useCallback(() => {
    if (filterBuilding && filterFloor) {
      router.push(
        `/room-manage/edit?building=${filterBuilding}&floor=${filterFloor}`
      )
    }
  }, [router, filterBuilding, filterFloor])

  const filteredEdges = useMemo(() => {
    if (!edges || !svgNodes) return []
    return edges.filter((edge) => {
      const fromInfo = parseNodeInfo(edge.from)
      const toInfo = parseNodeInfo(edge.to)

      return (
        fromInfo.building === filterBuilding &&
        fromInfo.floor === filterFloor &&
        toInfo.building === filterBuilding &&
        toInfo.floor === filterFloor
      )
    })
  }, [edges, svgNodes, filterBuilding, filterFloor, parseNodeInfo])

  const mapContent = useMemo(() => {
    if (!svgRaw || !filterBuilding || !filterFloor) return null

    const scale = Math.min(
      CANVAS_SIZE / svgViewBox.width,
      CANVAS_SIZE / svgViewBox.height
    )
    const offsetX = (CANVAS_SIZE - svgViewBox.width * scale) / 2
    const offsetY = (CANVAS_SIZE - svgViewBox.height * scale) / 2

    return {
      scale,
      offsetX,
      offsetY,
    }
  }, [svgRaw, svgViewBox, filterBuilding, filterFloor])

  return (
    <div className={styles["room-manage-map-wrap"]}>
      <div className={styles.mapToolbar}>
        <button
          className={`${styles.editMapButton} ${
            !(filterBuilding && filterFloor && svgRaw) ? styles.editMapButtonDisabled : ""
          }`}
          disabled={!(filterBuilding && filterFloor && svgRaw)}
          onClick={handleEditClick}
        >
          도면 편집
        </button>
      </div>
      <div
        className={styles.mapCanvasContainer}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      >
        {mapLoading && (
          <div className={styles["room-manage-canvas-placeholder"]}>맵 로딩 중...</div>
        )}
        {!mapLoading && (!filterBuilding || !filterFloor) && (
          <div className={styles["room-manage-canvas-placeholder"]}>
            건물과 층을 선택하면 맵이 표시됩니다.
          </div>
        )}
        {!mapLoading && filterBuilding && filterFloor && !svgRaw && (
          <div className={styles["room-manage-canvas-placeholder"]}>
            해당 건물/층의 맵 파일을 찾을 수 없습니다.
          </div>
        )}

        {/* SVG와 노드, 엣지 표시 */}
        {!mapLoading && filterBuilding && filterFloor && svgRaw && mapContent && (
          <div
            ref={mapContainerRef}
            className={styles.svgWrapper}
            style={{
              width: svgViewBox.width,
              height: svgViewBox.height,
              transform: `translate(${mapContent.offsetX}px, ${mapContent.offsetY}px) scale(${mapContent.scale})`,
            }}
          >
            {/* SVG 배경 */}
            <div
              className={styles.svgBackground}
              dangerouslySetInnerHTML={{ __html: svgRaw }}
            />
            {/* 네비 노드 연결선 (엣지) */}
            <svg
              className={styles.svgOverlay}
              style={{ width: svgViewBox.width, height: svgViewBox.height }}
            >
              {filteredEdges.map((edge, idx) => {
                const fromNode = svgNodes.find((node) => node.id === edge.from)
                const toNode = svgNodes.find((node) => node.id === edge.to)

                if (!fromNode || !toNode) {
                  return null
                }

                return (
                  <line
                    key={idx}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="red"
                    strokeWidth={2}
                    opacity={0.85}
                  />
                )
              })}
            </svg>
            {/* 네비 노드 오버레이(버튼) */}
            {svgNodes.map((node, index) => (
              <div
                key={`node-overlay-${node.id}-${index}`}
                className={`${styles.nodeOverlay} ${
                  selectedNode?.id === node.id ? styles.nodeOverlaySelected : ""
                }`}
                style={{
                  left: `${node.x - node.width / 2}px`,
                  top: `${node.y - node.height / 2}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                }}
                onClick={(e) => onNodeClick(node, e)}
                title={`ID: ${node.id}`}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}