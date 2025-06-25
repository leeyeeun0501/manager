"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import "./building.css"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [tableRows, setTableRows] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 7
  const [totalPages, setTotalPages] = useState(1)

  // 층 추가 인라인 폼 상태
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [addFloorBuilding, setAddFloorBuilding] = useState("")
  const [addFloorNum, setAddFloorNum] = useState("")
  const [addFloorFile, setAddFloorFile] = useState(null)
  const [addFloorError, setAddFloorError] = useState("")
  const addFloorFileRef = useRef(null)

  // 건물 추가 인라인 폼 상태
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [addBuildingName, setAddBuildingName] = useState("")
  const [addBuildingLng, setAddBuildingLng] = useState("")
  const [addBuildingLat, setAddBuildingLat] = useState("")
  const [addBuildingDesc, setAddBuildingDesc] = useState("")
  const [addBuildingError, setAddBuildingError] = useState("")

  // 건물 목록 불러오기
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch buildings")
        const data = await res.json()
        const buildingSet = new Set()
        if (data.all) {
          data.all.forEach((item) => buildingSet.add(item.building))
        }
        setBuildings(Array.from(buildingSet).sort())
      } catch (err) {
        setBuildings([])
      }
    }
    fetchBuildings()
  }, [])

  // 건물 선택 시 층 목록 불러오기
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

  // 층 선택 시 강의실 목록 불러오기
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
          desc: `${selectedBuilding} 설명`,
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

  // 아무것도 선택 안 했을 때 전체 데이터 불러오기
  useEffect(() => {
    if (selectedBuilding || selectedFloor) return
    async function fetchAllRows() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch all data")
        const data = await res.json()
        setTableRows(
          (data.all || []).map((row) => ({
            building: row.building,
            desc: `${row.building} 설명`,
            floor: row.floor,
            classroom: row.name,
            classroomDesc: row.desc,
          }))
        )
      } catch (err) {
        setTableRows([])
      }
    }
    fetchAllRows()
  }, [selectedBuilding, selectedFloor])

  // 페이지네이션 계산
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(tableRows.length / pageSize)))
    setPage(1)
  }, [tableRows])

  const pagedRows = tableRows.slice((page - 1) * pageSize, page * pageSize)

  // 층 추가 인라인 폼 제출
  const handleAddFloor = async (e) => {
    e.preventDefault()
    setAddFloorError("")
    if (!addFloorBuilding || !addFloorNum || !addFloorFile) {
      setAddFloorError("모든 항목을 입력하세요.")
      return
    }
    const formData = new FormData()
    formData.append("building_name", addFloorBuilding) // 서버에서 req.body.building
    formData.append("floor_number", addFloorNum) // 서버에서 req.body.floor
    formData.append("file", addFloorFile) // 서버에서 req.file

    try {
      const res = await fetch("/api/building-route", {
        method: "POST",
        body: formData,
        // Content-Type은 지정하지 마세요! (브라우저가 자동 생성)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAddFloorError(data.error || "층 추가 실패")
        return
      }
      alert("층 추가가 완료되었습니다!")
      setShowAddFloor(false)
      setAddFloorBuilding("")
      setAddFloorNum("")
      setAddFloorFile(null)
      if (addFloorFileRef.current) addFloorFileRef.current.value = null
      // 데이터 새로고침
      if (selectedBuilding === addFloorBuilding) {
        const floorsRes = await fetch(
          `/api/building-route?building=${encodeURIComponent(addFloorBuilding)}`
        )
        const floorsData = await floorsRes.json()
        setFloors(floorsData.floors || [])
      }
    } catch (err) {
      setAddFloorError("층 추가 중 오류가 발생했습니다.")
    }
  }

  // 건물 추가 인라인 폼 제출
  const handleAddBuilding = async (e) => {
    e.preventDefault()
    setAddBuildingError("")
    if (
      !addBuildingName ||
      !addBuildingLng ||
      !addBuildingLat ||
      !addBuildingDesc
    ) {
      setAddBuildingError("모든 항목을 입력하세요.")
      return
    }
    try {
      const res = await fetch("/api/building-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ building, floor }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAddBuildingError(data.error || "건물 추가 실패")
        return
      }
      alert("건물 추가가 완료되었습니다!")
      setShowAddBuilding(false)
      setAddBuildingName("")
      setAddBuildingLng("")
      setAddBuildingLat("")
      setAddBuildingDesc("")
      // 데이터 새로고침
      const buildingsRes = await fetch("/api/building-route")
      const buildingsData = await buildingsRes.json()
      const buildingSet = new Set()
      if (buildingsData.all) {
        buildingsData.all.forEach((item) => buildingSet.add(item.building))
      }
      setBuildings(Array.from(buildingSet).sort())
    } catch (err) {
      setAddBuildingError("건물 추가 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        <div className="building-filter-row">
          <select
            className="building-select"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">건물</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
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
            {floors.map((f) => (
              <option key={f} value={f}>
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

        {/* 층 추가 인라인 폼 */}
        {showAddFloor && (
          <form className="inline-add-floor-form" onSubmit={handleAddFloor}>
            <select
              value={addFloorBuilding}
              onChange={(e) => setAddFloorBuilding(e.target.value)}
              required
            >
              <option value="">건물 선택</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={addFloorNum}
              onChange={(e) => setAddFloorNum(e.target.value)}
              min={1}
              placeholder="층수"
              required
            />
            <input
              type="file"
              accept="image/png"
              ref={addFloorFileRef}
              onChange={(e) => setAddFloorFile(e.target.files[0])}
              required
            />
            <button type="submit" className="modal-save-btn">
              저장
            </button>
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setShowAddFloor(false)}
            >
              취소
            </button>
            {addFloorError && (
              <div className="modal-error">{addFloorError}</div>
            )}
          </form>
        )}

        {/* 건물 추가 인라인 폼 */}
        {showAddBuilding && (
          <form
            className="inline-add-building-form"
            onSubmit={handleAddBuilding}
          >
            <input
              type="text"
              value={addBuildingName}
              onChange={(e) => setAddBuildingName(e.target.value)}
              placeholder="건물명"
              required
            />
            <input
              type="number"
              value={addBuildingLng}
              onChange={(e) => setAddBuildingLng(e.target.value)}
              step="any"
              placeholder="경도"
              required
            />
            <input
              type="number"
              value={addBuildingLat}
              onChange={(e) => setAddBuildingLat(e.target.value)}
              step="any"
              placeholder="위도"
              required
            />
            <input
              type="text"
              value={addBuildingDesc}
              onChange={(e) => setAddBuildingDesc(e.target.value)}
              placeholder="설명"
              required
            />
            <button type="submit" className="modal-save-btn">
              저장
            </button>
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setShowAddBuilding(false)}
            >
              취소
            </button>
            {addBuildingError && (
              <div className="modal-error">{addBuildingError}</div>
            )}
          </form>
        )}

        <div className="building-table-wrap">
          <table className="building-table">
            <thead>
              <tr>
                <th>건물</th>
                <th>건물 설명</th>
                <th>층</th>
                <th>강의실명</th>
                <th>강의실 설명</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length > 0
                ? pagedRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.building}</td>
                      <td>{row.desc}</td>
                      <td>{row.floor}</td>
                      <td>{row.classroom}</td>
                      <td>{row.classroomDesc}</td>
                    </tr>
                  ))
                : Array.from({ length: pageSize }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={5}>&nbsp;</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="building-pagination-row">
          <button
            className="building-pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </button>
          <span className="building-pagination-info">
            {page} / {totalPages}
          </span>
          <button
            className="building-pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
