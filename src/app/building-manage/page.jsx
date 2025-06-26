"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import "./building.css"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildingInfos, setBuildingInfos] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([]) // [{ building, floor, fileBase64 }]
  const [selectedFloor, setSelectedFloor] = useState("")
  const [buildingPage, setBuildingPage] = useState(1)
  const [floorPage, setFloorPage] = useState(1)
  const pageSize = 10

  // 건물 목록 fetch
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch buildings")
        const data = await res.json()
        const infos = (data.all || [])
          .filter((b) => b && b.Building_Name)
          .map((b) => ({
            name: b.Building_Name,
            desc: b.Description || "",
          }))
        setBuildingInfos(infos)
      } catch (err) {
        setBuildingInfos([])
      }
    }
    fetchBuildings()
  }, [])

  // 건물 선택 시 해당 건물의 층 fetch
  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([])
      setSelectedFloor("")
      return
    }
    async function fetchFloors() {
      try {
        const res = await fetch(
          `/api/floor-route?building=${encodeURIComponent(selectedBuilding)}`
        )
        if (!res.ok) throw new Error("Failed to fetch floors")
        const data = await res.json()

        console.log("서버 응답:", data)

        setFloors(Array.isArray(data.floors) ? data.floors : [])
        setSelectedFloor("")
        setFloorPage(1)
      } catch (err) {
        setFloors([])
        setSelectedFloor("")
        setFloorPage(1)
      }
    }
    fetchFloors()
  }, [selectedBuilding])

  // 층 표 페이지네이션
  const floorFiltered = selectedFloor
    ? floors.filter((f) => String(f.floor) === String(selectedFloor))
    : floors
  const floorTotalPages = Math.max(
    1,
    Math.ceil((floorFiltered.length || 0) / pageSize)
  )
  const floorPaged = floorFiltered.slice(
    (floorPage - 1) * pageSize,
    floorPage * pageSize
  )

  // 건물 표 페이지네이션
  const buildingTotalPages = Math.max(
    1,
    Math.ceil((buildingInfos.length || 0) / pageSize)
  )
  const buildingPaged = buildingInfos.slice(
    (buildingPage - 1) * pageSize,
    buildingPage * pageSize
  )

  // floors 배열에서 중복 없는 층 번호만 추출
  const floorOptions = Array.from(
    new Set(floors.map((f) => String(f.floor)))
  ).sort((a, b) => Number(a) - Number(b))

  const [popupImg, setPopupImg] = useState(null) // base64 문자열 저장

  return (
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        <div className="building-filter-row">
          {/* 건물 콤보박스 */}
          <select
            className="building-select"
            value={selectedBuilding}
            onChange={(e) => {
              setSelectedBuilding(e.target.value)
              setFloorPage(1)
            }}
          >
            <option value="">건물</option>
            {buildingInfos.map((b, idx) => (
              <option key={b.name || idx} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          {/* 층 콤보박스: 건물 선택 시 항상 활성화. 옵션 없으면 "없음"만 */}
          <select
            className="floor-select"
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(e.target.value)
              setFloorPage(1)
            }}
            disabled={!selectedBuilding} // 건물 선택 전에는 비활성화
          >
            <option value="">전체</option>
            {floorOptions.length > 0 ? (
              floorOptions.map((f, idx) => (
                <option key={f || idx} value={f}>
                  {f}
                </option>
              ))
            ) : (
              <option value="" disabled>
                없음
              </option>
            )}
          </select>
        </div>

        <div className="table-row" style={{ display: "flex", gap: 40 }}>
          {/* 왼쪽: 건물 표 */}
          <div className="table-col" style={{ flex: 1, maxWidth: 500 }}>
            <table className="building-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }}>건물명</th>
                  <th style={{ minWidth: 200 }}>건물 설명</th>
                </tr>
              </thead>
              <tbody>
                {buildingPaged.length > 0 ? (
                  buildingPaged.map((b, idx) => (
                    <tr key={b.name || idx}>
                      <td>{b.name}</td>
                      <td>{b.desc}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      style={{ textAlign: "center", color: "#aaa" }}
                    >
                      건물 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* 건물 표 페이지네이션 */}
            <div className="building-pagination-row">
              <button
                className="building-pagination-btn"
                onClick={() => setBuildingPage((p) => Math.max(1, p - 1))}
                disabled={buildingPage === 1}
              >
                이전
              </button>
              <span className="building-pagination-info">
                {buildingPage} / {buildingTotalPages}
              </span>
              <button
                className="building-pagination-btn"
                onClick={() =>
                  setBuildingPage((p) => Math.min(buildingTotalPages, p + 1))
                }
                disabled={buildingPage === buildingTotalPages}
              >
                다음
              </button>
            </div>
          </div>
          {/* 오른쪽: 층 표 */}
          <div className="table-col" style={{ flex: 1, maxWidth: 700 }}>
            <table className="building-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }}>건물명</th>
                  <th style={{ minWidth: 60 }}>층</th>
                  <th style={{ minWidth: 150 }}>맵 파일</th>
                </tr>
              </thead>
              <tbody>
                {floorPaged.length > 0 ? (
                  floorPaged.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.building}</td>
                      <td>{row.floor}</td>
                      <td>
                        {row.file ? (
                          <>
                            <img
                              src={`data:image/png;base64,${row.file}`}
                              alt="맵 미리보기"
                              style={{
                                width: 60,
                                height: "auto",
                                border: "1px solid #ccc",
                                display: "block",
                                marginBottom: 4,
                                cursor: "pointer",
                              }}
                              onClick={() => setPopupImg(row.file)}
                            />
                            <button onClick={() => setPopupImg(row.file)}>
                              이미지 불러오기
                            </button>
                          </>
                        ) : (
                          <span style={{ color: "#aaa" }}>없음</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: "center", color: "#aaa" }}
                    >
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* 층 표 페이지네이션 */}
            <div className="building-pagination-row">
              <button
                className="building-pagination-btn"
                onClick={() => setFloorPage((p) => Math.max(1, p - 1))}
                disabled={floorPage === 1}
              >
                이전
              </button>
              <span className="building-pagination-info">
                {floorPage} / {floorTotalPages}
              </span>
              <button
                className="building-pagination-btn"
                onClick={() =>
                  setFloorPage((p) => Math.min(floorTotalPages, p + 1))
                }
                disabled={floorPage === floorTotalPages}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
      {popupImg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setPopupImg(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:image/png;base64,${popupImg}`}
              alt="확대 이미지"
              style={{
                maxWidth: "80vw",
                maxHeight: "80vh",
                display: "block",
                margin: "0 auto",
              }}
            />
            <button
              style={{
                marginTop: 16,
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
              onClick={() => setPopupImg(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
