// room-manage
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import "./room-manage.css"

export default function RoomManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 전체 건물/층 목록
  const [buildingOptions, setBuildingOptions] = useState([])
  const [floorOptions, setFloorOptions] = useState([])

  // 필터 상태
  const [filterBuilding, setFilterBuilding] = useState("")
  const [filterFloor, setFilterFloor] = useState("")

  // 강의실 정보 불러오기
  const fetchRooms = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/room-route")
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "강의실 정보를 불러올 수 없습니다.")
      setRooms(Array.isArray(data.rooms) ? data.rooms : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 전체 건물 목록 불러오기
  const fetchBuildings = async () => {
    try {
      const res = await fetch("/api/building-route")
      const data = await res.json()
      setBuildingOptions(
        (data.all || [])
          .filter((b) => b && b.Building_Name)
          .map((b) => b.Building_Name)
      )
    } catch {
      setBuildingOptions([])
    }
  }

  // 선택된 건물의 전체 층 목록 불러오기
  const fetchFloors = async (building) => {
    if (!building) {
      setFloorOptions([])
      return
    }
    try {
      const res = await fetch(
        `/api/floor-route?building=${encodeURIComponent(building)}`
      )
      const data = await res.json()
      setFloorOptions(
        Array.isArray(data.floors) ? data.floors.map((f) => f.floor) : []
      )
    } catch {
      setFloorOptions([])
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchBuildings()
  }, [])

  useEffect(() => {
    if (filterBuilding) {
      fetchFloors(filterBuilding)
    } else {
      setFloorOptions([])
    }
    setFilterFloor("")
  }, [filterBuilding])

  // 필터링된 rooms
  const filteredRooms = rooms.filter(
    (room) =>
      (!filterBuilding || room.building === filterBuilding) &&
      (!filterFloor || room.floor === filterFloor)
  )

  return (
    <div className="management-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="management-content">
        <h1>강의실 관리</h1>

        {/* ----------- 필터 콤보박스 ----------- */}
        <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
          <select
            value={filterBuilding}
            onChange={(e) => {
              setFilterBuilding(e.target.value)
              // setFilterFloor("")는 useEffect에서 자동 처리
            }}
            style={{ minWidth: 120 }}
          >
            <option value="">전체 건물</option>
            {buildingOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            style={{ minWidth: 80 }}
            disabled={!filterBuilding}
          >
            <option value="">전체 층</option>
            {floorOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* ----------- 강의실 표 ----------- */}
        {loading && <p>로딩 중...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && (
          <table className="user-table center-table">
            <thead>
              <tr>
                <th>건물명</th>
                <th>층</th>
                <th>강의실명</th>
                <th>강의실 설명</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={4}>강의실 데이터가 없습니다.</td>
                </tr>
              ) : (
                filteredRooms.map((room, idx) => (
                  <tr key={room.name + room.floor + room.building + idx}>
                    <td>{room.building}</td>
                    <td>{room.floor}</td>
                    <td>{room.name}</td>
                    <td>{room.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
