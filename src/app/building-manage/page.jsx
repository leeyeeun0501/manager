"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import "./building.css"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [buildingInfos, setBuildingInfos] = useState([]) // 건물명+설명 객체 배열
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [tableRows, setTableRows] = useState([])

  // 페이지네이션
  const [buildingPage, setBuildingPage] = useState(1)
  const [floorPage, setFloorPage] = useState(1)
  const pageSize = 10

  // ... (폼/수정 상태 등 기존과 동일)

  // 건물 목록 및 설명 fetch
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch buildings")
        const data = await res.json()
        // data.all: [{ Building_Name, Desc }]
        const infos = (data.all || [])
          .filter((b) => b && b.Building_Name)
          .map((b) => ({
            name: b.Building_Name,
            desc: b.Description || "",
          }))
        setBuildingInfos(infos)
        setBuildings(infos.map((b) => b.name))
      } catch (err) {
        setBuildingInfos([])
        setBuildings([])
      }
    }
    fetchBuildings()
  }, [])

  // 건물 선택 시 층 목록 fetch
  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([])
      setSelectedFloor("")
      setTableRows([])
      return
    }
    async function fetchFloors() {
      try {
        const res = await fetch(
          `/api/building-route?building=${encodeURIComponent(selectedBuilding)}`
        )
        if (!res.ok) throw new Error("Failed to fetch floors")
        const data = await res.json()
        setFloors(data.floors || [])
        setSelectedFloor("")
        setTableRows([])
      } catch (err) {
        setFloors([])
        setSelectedFloor("")
        setTableRows([])
      }
    }
    fetchFloors()
  }, [selectedBuilding])

  // 층 선택 시 강의실 목록 fetch
  useEffect(() => {
    if (!selectedBuilding || !selectedFloor) {
      setTableRows([])
      return
    }
    async function fetchClassrooms() {
      try {
        const res = await fetch(
          `/api/building-route?building=${encodeURIComponent(
            selectedBuilding
          )}&floor=${encodeURIComponent(selectedFloor)}`
        )
        if (!res.ok) throw new Error("Failed to fetch classrooms")
        const data = await res.json()
        const rows = (data.classrooms || []).map((room) => ({
          building: selectedBuilding,
          floor: selectedFloor,
          classroom: room.name,
          classroomDesc: room.desc,
        }))
        setTableRows(rows)
      } catch (err) {
        setTableRows([])
      }
    }
    fetchClassrooms()
  }, [selectedBuilding, selectedFloor])

  // 건물 표 페이지네이션
  const buildingTotalPages = Math.max(
    1,
    Math.ceil((buildingInfos.length || 0) / pageSize)
  )
  const buildingPaged = (buildingInfos || []).slice(
    (buildingPage - 1) * pageSize,
    buildingPage * pageSize
  )

  // 층 표 페이지네이션
  const floorTotalPages = Math.max(
    1,
    Math.ceil((tableRows.length || 0) / pageSize)
  )
  const floorPaged = (tableRows || []).slice(
    (floorPage - 1) * pageSize,
    floorPage * pageSize
  )

  // ... (폼/수정 핸들러 등 기존과 동일)

  return (
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        {/* 기존: 콤보박스, 추가 버튼, 폼 등은 그대로 */}
        <div className="building-filter-row">
          <select
            className="building-select"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">건물</option>
            {buildings.map((b, idx) => (
              <option key={b || idx} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className="floor-select"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            disabled={!floors.length}
          >
            <option value="">층</option>
            {floors.map((f, idx) => (
              <option key={f || idx} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            className="add-floor-btn"
            onClick={() => setShowAddFloor((v) => !v)}
          >
            층 추가
          </button>
          <button
            className="add-building-btn"
            onClick={() => setShowAddBuilding((v) => !v)}
          >
            건물 추가
          </button>
        </div>

        {/* ... (인라인 폼, 수정 폼 등 기존 코드 그대로) */}

        {/* 표 두 개를 Flexbox로 가로 배치 */}
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
                  <th style={{ minWidth: 150 }}>강의실명</th>
                  <th style={{ minWidth: 200 }}>강의실 설명</th>
                </tr>
              </thead>
              <tbody>
                {floorPaged.length > 0 ? (
                  floorPaged.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.building}</td>
                      <td>{row.floor}</td>
                      <td>{row.classroom}</td>
                      <td>{row.classroomDesc}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
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
