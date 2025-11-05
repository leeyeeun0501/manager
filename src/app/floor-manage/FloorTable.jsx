// 층 관리 테이블 컴포넌트
"use client"
import React from "react"
import { FaTrashAlt } from "react-icons/fa"
import styles from "./floor-manage.module.css"

export default function FloorTable({
  floorPaged,
  selectedBuilding,
  selectedFloor,
  onMapPreview,
  onDelete,
}) {
  return (
    <div className={styles["building-table-wrap"]}>
      <table
        className={`${styles["custom-table"]} ${styles["bordered-table"]}`}
      >
        <thead>
          <tr>
            <th>건물명</th>
            <th>층</th>
            <th>맵 파일</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {floorPaged.length > 0 ? (
            floorPaged.map((row, idx) => (
              <tr key={row.building + "-" + row.floor + "-" + idx}>
                <td>{row.building}</td>
                <td>{row.floor}</td>
                <td className={styles.fileCell}>
                  {row.file ? (
                    <button
                      type="button"
                      className={styles.filePreviewBtn}
                      onClick={() => onMapPreview(row)}
                    >
                      2D 도면 미리보기
                    </button>
                  ) : (
                    <span style={{ color: "#aaa" }}>없음</span>
                  )}
                </td>
                <td>
                  <button
                    className={styles["delete-btn"]}
                    onClick={() => onDelete(row.building, row.floor)}
                    title="삭제"
                  >
                    <FaTrashAlt size={18} color="#e74c3c" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className={styles.noDataCell}>
                {selectedBuilding && selectedFloor
                  ? `${selectedBuilding} ${selectedFloor}층 데이터가 없습니다`
                  : selectedBuilding
                  ? `${selectedBuilding} 건물의 층 데이터가 없습니다`
                  : "데이터가 없습니다"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

