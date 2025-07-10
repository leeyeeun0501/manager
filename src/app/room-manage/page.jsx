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

  // 맵 이미지 관련
  const [imgUrl, setImgUrl] = useState("")
  const imgRef = useRef(null)

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

  const [svgRaw, setSvgRaw] = useState("") // SVG 텍스트 원본
  const [mapNodes, setMapNodes] = useState([])
  const [mapEdges, setMapEdges] = useState([])
  const [mapLoading, setMapLoading] = useState(false)

  useEffect(() => {
    if (filterBuilding && filterFloor) {
      setMapLoading(true)
      fetch(
        `/api/mapfile-image-route?building=${encodeURIComponent(
          filterBuilding
        )}&floor=${encodeURIComponent(filterFloor)}`
      )
        .then((res) => res.text()) // 반드시 .text()!
        .then((svgText) => {
          setSvgRaw(svgText)
          console.log("svg text 확인:", svgText)
        })
        .finally(() => setMapLoading(false))
    } else {
      setSvgRaw("")
    }
  }, [filterBuilding, filterFloor])

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
      console.log("강의실 조회 응답:", data)

      // 🔧 응답 포맷에 따라 유연하게 처리
      let roomList = []

      if (Array.isArray(data)) {
        roomList = data // 배열 자체가 옴
      } else if (Array.isArray(data.rooms)) {
        roomList = data.rooms // 객체 내에 rooms 속성으로 배열이 옴
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

  // 맵 이미지 불러오기 핸들러
  const handleLoadMap = async () => {
    setImgUrl("")
    setMapLoading(true)
    try {
      const res = await fetch(
        `/api/mapfile-image-route?floor=${encodeURIComponent(
          filterFloor
        )}&building=${encodeURIComponent(filterBuilding)}`
      )
      if (!res.ok) {
        setImgUrl("")
        setMapLoading(false)
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setImgUrl(objectUrl)
    } catch (e) {
      setImgUrl("")
    }
    setMapLoading(false)
  }

  // 맵 클릭 시 강의실 추가 폼 열리기 핸들러
  const handleImageClick = (e) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    setAddPopup({ x, y })
    setAddForm({ room_name: "", room_desc: "", x, y })
    setAddMsg("")
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

  useEffect(() => {
    // 페이지 바뀔 때 스크롤 맨 위로 (필요시)
    // window.scrollTo(0, 0)
  }, [currentPage])

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
          <button
            onClick={handleLoadMap}
            disabled={!filterBuilding || !filterFloor}
          >
            맵 불러오기
          </button>
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
          <div className="room-manage-canvas-outer">
            <div
              className="room-manage-canvas"
              style={{ position: "relative" }}
            >
              {mapLoading ? (
                <div className="room-manage-canvas-placeholder">로딩 중...</div>
              ) : (
                <>
                  {/* 1. SVG 도면(배경) */}
                  {svgRaw && (
                    <div
                      className="svg-canvas"
                      style={{
                        width: 400,
                        height: 400,
                        background: "#f5f6fa",
                        borderRadius: 16,
                        overflow: "auto",
                        border: "2px solid #2574f5",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 1,
                      }}
                      dangerouslySetInnerHTML={{ __html: svgRaw }}
                    />
                  )}

                  {/* 2. 노드/엣지 오버레이 */}
                  <svg
                    width={400}
                    height={400}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      pointerEvents: "none", // 노드/엣지만 이벤트 허용
                      zIndex: 2,
                    }}
                  >
                    {/* 엣지(연결선) */}
                    {mapEdges.map((edge, i) => {
                      const from = mapNodes.find((n) => n.id === edge.from)
                      const to = mapNodes.find((n) => n.id === edge.to)
                      if (!from || !to) return null
                      return (
                        <line
                          key={i}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke="#2574f5"
                          strokeWidth={2}
                          opacity={0.8}
                          pointerEvents="visibleStroke"
                          onClick={() =>
                            alert(`엣지 클릭: ${edge.from} - ${edge.to}`)
                          }
                        />
                      )
                    })}
                    {/* 노드(강의실) */}
                    {mapNodes.map((node) => (
                      <g
                        key={node.id}
                        style={{ cursor: "pointer" }}
                        pointerEvents="visiblePainted"
                        onClick={() => alert(`노드 클릭: ${node.name}`)}
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={18}
                          fill="#fff"
                          stroke="#2574f5"
                          strokeWidth={2}
                        />
                        <text
                          x={node.x}
                          y={node.y + 5}
                          fontSize={12}
                          textAnchor="middle"
                          fill="#2574f5"
                          pointerEvents="none"
                        >
                          {node.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                  {/* 3. 안내 메시지 */}
                  {!svgRaw && (
                    <div
                      className="room-manage-canvas-placeholder"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 400,
                        height: 400,
                        zIndex: 3,
                      }}
                    >
                      건물과 층을 선택 후 맵을 불러오세요.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 수정 모달 등 기존 UI 유지 */}
        {showEditRoomModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setShowEditRoomModal(false)}
          >
            <div
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 8,
                minWidth: 320,
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 12 }}>강의실 정보 수정</h3>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  style={{ width: "100%", padding: 8, fontSize: 16 }}
                  placeholder="강의실명"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  value={editRoomDesc}
                  onChange={(e) => setEditRoomDesc(e.target.value)}
                  style={{ width: "100%", padding: 8, fontSize: 16 }}
                  placeholder="강의실 설명"
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="modal-save-btn"
                  onClick={handleEditRoom}
                  disabled={editRoomLoading}
                >
                  {editRoomLoading ? "저장 중..." : "저장"}
                </button>
                <button
                  className="modal-cancel-btn"
                  onClick={() => setShowEditRoomModal(false)}
                >
                  취소
                </button>
              </div>
              {editRoomError && (
                <div style={{ color: "red", marginTop: 8 }}>
                  {editRoomError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
