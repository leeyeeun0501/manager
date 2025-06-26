"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import "./building.css"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildingInfos, setBuildingInfos] = useState([]) // [{ name, desc }]
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([]) // [{ building, floor, fileBase64 }]
  const [selectedFloor, setSelectedFloor] = useState("")
  const [buildingPage, setBuildingPage] = useState(1)
  const [floorPage, setFloorPage] = useState(1)
  const pageSize = 10

  // 건물 목록 및 설명 fetch
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

  // 건물 선택 시 층 목록 fetch
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
        console.log("층 콤보박스/표 데이터:", data.floors) // ← 여기!
        setFloors(data.floors || [])
        setSelectedFloor("")
      } catch (err) {
        setFloors([])
        setSelectedFloor("")
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

  return (
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        <div className="building-filter-row">
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
          <select
            className="floor-select"
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(e.target.value)
              setFloorPage(1)
            }}
            disabled={!floorOptions.length}
          >
            <option value="">층</option>
            {floorOptions.map((f, idx) => (
              <option key={f || idx} value={f}>
                {f}
              </option>
            ))}
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
                        {row.fileBase64 ? (
                          <a
                            href={`data:image/png;base64,${row.fileBase64}`}
                            download={`${row.building}_${row.floor}.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={`data:image/png;base64,${row.fileBase64}`}
                              alt="맵 미리보기"
                              style={{
                                width: 60,
                                height: "auto",
                                border: "1px solid #ccc",
                              }}
                            />
                            <br />
                            다운로드
                          </a>
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
    </div>
  )
}
