// 맵 캔버스 컴포넌트
"use client"
import React, { useMemo } from "react"
import styles from "../room-manage.module.css"

export default function MapCanvas({
  svgRaw,
  canvasSize,
  svgViewBox,
  mapContainerRef,
  onMapClick,
  svgNodes,
  deletedNodes,
  pendingNodes,
  svgCategories,
  deletedCategories,
  pendingCategories,
  onNodeClick,
  onCategoryClick,
  isAddingMode,
  isAddingCategoryMode,
  categoryNameMap,
}) {
  const mapContent = useMemo(() => {
    if (!svgRaw) return null

    const scale = Math.min(
      canvasSize.width / svgViewBox.width,
      canvasSize.height / svgViewBox.height
    )
    const offsetX = (canvasSize.width - svgViewBox.width * scale) / 2
    const offsetY = (canvasSize.height - svgViewBox.height * scale) / 2

    const cursorStyle = isAddingMode || isAddingCategoryMode ? "crosshair" : "default"
    const transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`

    return (
      <div
        ref={mapContainerRef}
        onClick={onMapClick}
        className={styles.editPageSvgWrapper}
        style={{
          width: svgViewBox.width,
          height: svgViewBox.height,
          transform,
          cursor: cursorStyle,
        }}
      >
        <div
          className={styles.editPageSvgContent}
          dangerouslySetInnerHTML={{ __html: svgRaw }}
        />

        {/* 기존 노드들 */}
        {svgNodes.map((node) => (
          <div
            key={`node-overlay-${node.id}`}
            onClick={() => onNodeClick(node)}
            className={styles.editPageNodeOverlay}
            style={{
              left: `${node.x - node.width / 2}px`,
              top: `${node.y - node.height / 2}px`,
              width: `${node.width}px`,
              height: `${node.height}px`,
            }}
            title={`노드: ${node.id.split('@')[2]}`}
          />
        ))}

        {/* 삭제된 노드들 */}
        {deletedNodes.map((node) => (
          <div
            key={`deleted-node-${node.id}`}
            className={styles.editPageDeletedNodeOverlay}
            style={{
              left: `${node.x - node.width / 2}px`,
              top: `${node.y - node.height / 2}px`,
              width: `${node.width}px`,
              height: `${node.height}px`,
            }}
            title={`삭제된 노드: ${node.id.split('@')[2]}`}
          />
        ))}

        {/* 임시로 추가된 노드들 */}
        {pendingNodes.map((node) => (
          <div
            key={`pending-node-${node.id}`}
            className={styles.editPagePendingNodeOverlay}
            style={{
              left: `${node.x - node.width / 2}px`,
              top: `${node.y - node.height / 2}px`,
              width: `${node.width}px`,
              height: `${node.height}px`,
            }}
            title={`새 노드: ${node.id}`}
          />
        ))}

        {/* SVG에서 파싱된 카테고리들 */}
        {svgCategories.map((category, index) => (
          <div
            key={`svg-category-${category.id}-${index}`}
            onClick={() => onCategoryClick(category)}
            className={styles.editPageSvgCategoryOverlay}
            style={{
              left: `${category.x - category.width / 2}px`,
              top: `${category.y - category.height / 2}px`,
              width: `${category.width}px`,
              height: `${category.height}px`,
              borderRadius: category.element === "rect" ? "4px" : "50%",
            }}
            title={`카테고리: ${categoryNameMap[category.categoryType] || category.categoryType}`}
          />
        ))}

        {/* 삭제된 카테고리들 */}
        {deletedCategories.map((category, index) => (
          <div
            key={`deleted-category-${category.id}-${index}`}
            className={styles.editPageDeletedCategoryOverlay}
            style={{
              left: `${category.x - category.width / 2}px`,
              top: `${category.y - category.height / 2}px`,
              width: `${category.width}px`,
              height: `${category.height}px`,
              borderRadius: category.element === "rect" ? "4px" : "50%",
            }}
            title={`삭제된 카테고리: ${categoryNameMap[category.categoryType] || category.categoryType}`}
          />
        ))}

        {/* 임시로 추가된 카테고리들 */}
        {pendingCategories.map((category, index) => (
          <div
            key={`pending-category-${category.id}-${index}`}
            className={styles.editPagePendingCategoryOverlay}
            style={{
              left: `${category.x - category.width / 2}px`,
              top: `${category.y - category.height / 2}px`,
              width: `${category.width}px`,
              height: `${category.height}px`,
              borderRadius: category.element === "rect" ? "4px" : "50%",
            }}
            title={`새 카테고리: ${categoryNameMap[category.categoryType] || category.categoryType}`}
          />
        ))}
      </div>
    )
  }, [
    svgRaw,
    canvasSize,
    svgViewBox,
    mapContainerRef,
    onMapClick,
    svgNodes,
    deletedNodes,
    pendingNodes,
    svgCategories,
    deletedCategories,
    pendingCategories,
    onNodeClick,
    onCategoryClick,
    isAddingMode,
    isAddingCategoryMode,
    categoryNameMap,
  ])

  return mapContent
}

