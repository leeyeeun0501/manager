// room-manage/page.jsx
"use client"
import React, { useRef, useState, useEffect } from "react"
import Menu from "../components/menu"
import "./room-manage.css"
import { MdEditSquare, MdDelete } from "react-icons/md"

export default function RoomManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 건물/층 목록
  const [buildingOptions, setBuildingOptions] = useState([])
  const [floorOptions, setFloorOptions] = useState([])

  // 필터 상태
  const [filterBuilding, setFilterBuilding] = useState("")
  const [filterFloor, setFilterFloor] = useState("")

  // 강의실 추가 팝업
  const [addPopup, setAddPopup] = useState(null)
  const [addForm, setAddForm] = useState({
    room_name: "",
    room_desc: "",
    x: "",
    y: "",
  })
  const [addMsg, setAddMsg] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [editRoomName, setEditRoomName] = useState("")
  const [editRoomDesc, setEditRoomDesc] = useState("")
  const [editRoomError, setEditRoomError] = useState("")
  const [editRoomLoading, setEditRoomLoading] = useState(false)
  const [editRoomOldName, setEditRoomOldName] = useState("")

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // SVG 및 맵 관련 상태
  const [svgRaw, setSvgRaw] = useState("")
  const [mapLoading, setMapLoading] = useState(false)
  const [svgViewBox, setSvgViewBox] = useState({
    x: 0,
    y: 0,
    width: 400,
    height: 400,
  })

  const CANVAS_SIZE = 400
  const mapContainerRef = useRef(null)

  const normalizeRoom = (room) => {
    return {
      building: room.building || room.Building_Name || "",
      floor: room.floor || room.Floor_Number || "",
      name: room.name || room.Room_Name || "",
      description: room.description || room.Room_Description || "",
    }
  }

  // 페이징
  const totalRooms = rooms.length
  const totalPages = Math.ceil(totalRooms / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const pagedRooms = rooms.slice(startIdx, endIdx)

  // SVG 처리 및 viewBox 설정 - 개선된 버전
  const processSvg = (svgXml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const svgEl = doc.querySelector("svg")

    if (!svgEl) return svgXml

    // 기존 viewBox가 있다면 사용
    const existingViewBox = svgEl.getAttribute("viewBox")
    if (existingViewBox) {
      const parts = existingViewBox.split(/[\s,]+/).map(Number)
      if (parts.length === 4) {
        setSvgViewBox({
          x: parts[0],
          y: parts[1],
          width: parts[2],
          height: parts[3],
        })
        return svgXml
      }
    }

    // width, height 속성에서 크기 가져오기
    const width = parseFloat(svgEl.getAttribute("width")) || 400
    const height = parseFloat(svgEl.getAttribute("height")) || 400

    // viewBox 설정
    const viewBoxStr = `0 0 ${width} ${height}`
    svgEl.setAttribute("viewBox", viewBoxStr)
    setSvgViewBox({
      x: 0,
      y: 0,
      width: width,
      height: height,
    })

    // 불필요한 width, height 속성 제거하여 반응형으로 만들기
    svgEl.removeAttribute("width")
    svgEl.removeAttribute("height")

    return doc.documentElement.outerHTML
  }

  // 캔버스 클릭 핸들러 - 강의실 추가용
  const handleMapClick = (e) => {
    if (!mapContainerRef.current) return

    const rect = mapContainerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // SVG 좌표계로 변환
    const svgX = (clickX / rect.width) * svgViewBox.width + svgViewBox.x
    const svgY = (clickY / rect.height) * svgViewBox.height + svgViewBox.y

    setAddPopup({ x: e.clientX, y: e.clientY })
    setAddForm({
      room_name: "",
      room_desc: "",
      x: Math.round(svgX),
      y: Math.round(svgY),
    })
    setAddMsg("")
  }

  // 1. 건물 목록만 최초 1회 받아오기
  useEffect(() => {
    fetchBuildings()
    fetchRooms() // 전체 강의실 조회
  }, [])

  // 2. 건물 선택 시: 층 목록 + 해당 건물 전체 강의실 조회
  useEffect(() => {
    if (!filterBuilding) {
      setFloorOptions([])
      setFilterFloor("")
      fetchRooms() // 전체 강의실
      return
    }
    fetchFloors(filterBuilding)
    fetchRooms(filterBuilding) // 해당 건물 전체 강의실
    setFilterFloor("")
  }, [filterBuilding])

  // 3. 층 선택 시: 해당 건물, 해당 층 강의실만 조회
  useEffect(() => {
    if (filterBuilding && filterFloor) {
      fetchRooms(filterBuilding, filterFloor)
    }
  }, [filterFloor, filterBuilding])

  // SVG 로드
  useEffect(() => {
    if (filterBuilding && filterFloor) {
      setMapLoading(true)
      fetch(
        `/api/mapfile-image-route?building=${encodeURIComponent(
          filterBuilding
        )}&floor=${encodeURIComponent(filterFloor)}`
      )
        .then((res) => res.json())
        .then((data) => {
          const fileList = Array.isArray(data) ? data : []
          const svgUrl = fileList[0]?.File
          if (svgUrl) {
            fetch(svgUrl)
              .then((res) => res.text())
              .then((svgXml) => {
                const processedSvg = processSvg(svgXml)
                setSvgRaw(processedSvg)
              })
              .catch(() => {
                setSvgRaw("")
              })
          } else {
            setSvgRaw("")
          }
        })
        .catch(() => {
          setSvgRaw("")
        })
        .finally(() => setMapLoading(false))
    } else {
      setSvgRaw("")
    }
  }, [filterBuilding, filterFloor])

  // 건물 목록
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

  // 층 목록
  const fetchFloors = async (building) => {
    if (!building) {
      setFloorOptions([])
      return
    }
    try {
      const res = await fetch(
        `/api/floor-route?building=${encodeURIComponent(building)}&type=names`
      )
      const data = await res.json()
      setFloorOptions(Array.isArray(data.floors) ? data.floors : [])
    } catch {
      setFloorOptions([])
    }
  }

  // 강의실 정보: 전체/건물/건물+층 조회
  const fetchRooms = async (building, floor) => {
    setLoading(true)
    setError("")
    try {
      let url = "/api/room-route"
      if (building && floor) {
        url += `/${encodeURIComponent(building)}/${encodeURIComponent(floor)}`
      } else if (building) {
        url += `/${encodeURIComponent(building)}`
      }

      const res = await fetch(url)
      const data = await res.json()

      let roomList = []
      if (Array.isArray(data)) {
        roomList = data
      } else if (Array.isArray(data.rooms)) {
        roomList = data.rooms
      } else {
        throw new Error(data.error || "강의실 정보를 불러올 수 없습니다.")
      }

      const mapped = roomList.map(normalizeRoom)
      setRooms(mapped)
    } catch (err) {
      setError(err.message)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  // 강의실 추가 폼 제출 핸들러
  const handleAddRoom = async (e) => {
    e.preventDefault()
    setAddMsg("")
    setAddLoading(true)
    try {
      const res = await fetch(
        `/api/room-route/${encodeURIComponent(
          filterBuilding
        )}/${encodeURIComponent(filterFloor)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name: addForm.room_name,
            room_desc: addForm.room_desc,
            x: addForm.x,
            y: addForm.y,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setAddMsg(data.error || "방 추가 실패")
      } else {
        setAddMsg("강의실이 추가되었습니다!")
        setAddPopup(null)
        fetchRooms(filterBuilding, filterFloor)
      }
    } catch {
      setAddMsg("서버 오류가 발생했습니다.")
    } finally {
      setAddLoading(false)
    }
  }

  // 방 삭제 핸들러
  const handleDeleteRoom = async (building, floor, room_name) => {
    if (
      !window.confirm(
        `정말로 ${building} ${floor}층 ${room_name} 방을 삭제하시겠습니까?`
      )
    )
      return
    try {
      const res = await fetch(
        `/api/room-route/${encodeURIComponent(building)}/${encodeURIComponent(
          floor
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_name }),
        }
      )
      const text = await res.text()
      if (res.status === 200) {
        fetchRooms(filterBuilding, filterFloor)
        alert(text)
      } else {
        alert(text)
      }
    } catch (err) {
      alert("방 삭제 중 오류가 발생했습니다.")
    }
  }

  // 강의실 수정 핸들러
  const handleEditRoom = async () => {
    setEditRoomError("")
    if (!editRoom) return
    setEditRoomLoading(true)
    try {
      const res = await fetch(
        `/api/room-route/${encodeURIComponent(
          editRoom.building
        )}/${encodeURIComponent(editRoom.floor)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            old_room_name: editRoomOldName,
            room_name: editRoomName,
            room_desc: editRoomDesc,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setEditRoomError(data.error || "수정 실패")
        return
      }
      fetchRooms(filterBuilding, filterFloor)
      setShowEditRoomModal(false)
      setEditRoom(null)
      setEditRoomName("")
      setEditRoomDesc("")
      setEditRoomOldName("")
    } catch {
      setEditRoomError("수정 중 오류가 발생했습니다.")
    } finally {
      setEditRoomLoading(false)
    }
  }

  return (
    <div className="management-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="management-content">
        <h1>강의실 관리</h1>
        <div className="room-manage-filter-row">
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
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
            disabled={!filterBuilding}
          >
            <option value="">전체 층</option>
            {floorOptions.map((f, idx) =>
              typeof f === "object" && f !== null ? (
                <option key={f.floor ?? idx} value={f.floor}>
                  {f.floor}
                </option>
              ) : (
                <option key={String(f)} value={f}>
                  {f}
                </option>
              )
            )}
          </select>
        </div>

        {/* 표와 맵을 한 줄에 나란히 */}
        <div className="room-manage-main-row">
          {/* 표 */}
          <div className="room-manage-table-wrap">
            {loading && <p>로딩 중...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
              <>
                <table className="user-table center-table">
                  <thead>
                    <tr>
                      <th>건물명</th>
                      <th>층</th>
                      <th>강의실명</th>
                      <th>강의실 설명</th>
                      <th>삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRooms.length === 0 ? (
                      <tr>
                        <td colSpan={5}>강의실 데이터가 없습니다.</td>
                      </tr>
                    ) : (
                      pagedRooms.map((room, idx) => (
                        <tr
                          key={
                            room.building && room.floor && room.name
                              ? `${room.building}-${room.floor}-${room.name}`
                              : `row-${idx}`
                          }
                        >
                          <td>{room.building}</td>
                          <td>{room.floor}</td>
                          <td>{room.name}</td>
                          <td style={{ position: "relative" }}>
                            {room.description}
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                marginLeft: 6,
                                position: "absolute",
                                right: 6,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                              onClick={() => {
                                setEditRoom(room)
                                setEditRoomName(room.name)
                                setEditRoomDesc(room.description || "")
                                setEditRoomOldName(room.name)
                                setShowEditRoomModal(true)
                                setEditRoomError("")
                              }}
                              aria-label="강의실 정보 수정"
                            >
                              <MdEditSquare size={18} color="#007bff" />
                            </button>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                              }}
                              onClick={() =>
                                handleDeleteRoom(
                                  room.building,
                                  room.floor,
                                  room.name
                                )
                              }
                              aria-label="강의실 삭제"
                              title="삭제"
                            >
                              <MdDelete size={22} color="#e74c3c" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* 페이지네이션 */}
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    다음
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 맵 */}
          <div className="room-manage-map-wrap">
            {filterBuilding && filterFloor && (
              <div style={{ marginBottom: 10, fontSize: 14, color: "#666" }}>
                맵을 클릭하면 해당 위치에 강의실을 추가할 수 있습니다.
              </div>
            )}

            {mapLoading && <p>맵 로딩 중...</p>}

            {!mapLoading && filterBuilding && filterFloor && svgRaw && (
              <div
                ref={mapContainerRef}
                style={{
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE,
                  border: "1px solid #ddd",
                  cursor: "crosshair",
                  backgroundColor: "#f8f9fa",
                  overflow: "hidden",
                }}
                onClick={handleMapClick}
                dangerouslySetInnerHTML={{ __html: svgRaw }}
              />
            )}

            {!mapLoading && (!filterBuilding || !filterFloor) && (
              <div
                style={{
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE,
                  border: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8f9fa",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                건물과 층을 선택하면 맵이 표시됩니다.
              </div>
            )}

            {!mapLoading && filterBuilding && filterFloor && !svgRaw && (
              <div
                style={{
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE,
                  border: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8f9fa",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                해당 건물/층의 맵 파일을 찾을 수 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 강의실 추가 팝업 */}
      {addPopup && (
        <div
          style={{
            position: "fixed",
            top: Math.min(addPopup.y + 10, window.innerHeight - 300),
            left: Math.min(addPopup.x + 10, window.innerWidth - 280),
            backgroundColor: "white",
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: 250,
          }}
        >
          <h4>강의실 추가</h4>
          <form onSubmit={handleAddRoom}>
            <div style={{ marginBottom: 8 }}>
              <label>강의실명:</label>
              <input
                type="text"
                value={addForm.room_name}
                onChange={(e) =>
                  setAddForm({ ...addForm, room_name: e.target.value })
                }
                required
                style={{ width: "100%", padding: 4, marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>설명:</label>
              <input
                type="text"
                value={addForm.room_desc}
                onChange={(e) =>
                  setAddForm({ ...addForm, room_desc: e.target.value })
                }
                style={{ width: "100%", padding: 4, marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>X 좌표: {addForm.x}</label>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Y 좌표: {addForm.y}</label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={addLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: addLoading ? "not-allowed" : "pointer",
                }}
              >
                {addLoading ? "추가 중..." : "추가"}
              </button>
              <button
                type="button"
                onClick={() => setAddPopup(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            </div>
          </form>
          {addMsg && (
            <p
              style={{
                marginTop: 8,
                color: addMsg.includes("추가되었습니다") ? "green" : "red",
              }}
            >
              {addMsg}
            </p>
          )}
        </div>
      )}

      {/* 강의실 수정 모달 */}
      {showEditRoomModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
              maxWidth: 500,
            }}
          >
            <h3>강의실 정보 수정</h3>
            <div style={{ marginBottom: 16 }}>
              <label>강의실명:</label>
              <input
                type="text"
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>설명:</label>
              <input
                type="text"
                value={editRoomDesc}
                onChange={(e) => setEditRoomDesc(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </div>
            {editRoomError && (
              <p style={{ color: "red", marginBottom: 16 }}>{editRoomError}</p>
            )}
            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setShowEditRoomModal(false)
                  setEditRoom(null)
                  setEditRoomName("")
                  setEditRoomDesc("")
                  setEditRoomOldName("")
                  setEditRoomError("")
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleEditRoom}
                disabled={editRoomLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: editRoomLoading ? "not-allowed" : "pointer",
                }}
              >
                {editRoomLoading ? "수정 중..." : "수정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
