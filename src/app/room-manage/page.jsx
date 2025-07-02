// room-manage
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

  // 전체 건물/층 목록
  const [buildingOptions, setBuildingOptions] = useState([])
  const [floorOptions, setFloorOptions] = useState([])

  // 필터 상태
  const [filterBuilding, setFilterBuilding] = useState("")
  const [filterFloor, setFilterFloor] = useState("")

  // 맵 이미지 관련
  const [imgUrl, setImgUrl] = useState("")
  const [mapLoading, setMapLoading] = useState(false)
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
    setImgUrl("")
  }, [filterBuilding])

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

  // 강의실 정보
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
        fetchRooms()
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
        fetchRooms() // 삭제 후 최신 목록 불러오기
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
      fetchRooms()
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

  // 룸 필터링
  const filteredRooms = rooms.filter(
    (room) =>
      (!filterBuilding || room.building === filterBuilding) &&
      (!filterFloor || room.floor === filterFloor)
  )

  // 페이징
  const totalRooms = filteredRooms.length
  const totalPages = Math.ceil(totalRooms / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const pagedRooms = filteredRooms.slice(startIdx, endIdx)

  // 페이지 변경 시 스크롤 유지
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
            {floorOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
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
                        <tr key={`${room.building}-${room.floor}-${room.name}`}>
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
            <div className="room-manage-canvas">
              {mapLoading ? (
                <div className="room-manage-canvas-placeholder">로딩 중...</div>
              ) : imgUrl ? (
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt="도면"
                  className="room-manage-canvas-img"
                  onClick={handleImageClick}
                />
              ) : (
                <div className="room-manage-canvas-placeholder">
                  건물과 층을 선택 후 맵을 불러오세요.
                </div>
              )}
              {/* 강의실 추가 팝업 */}
              {addPopup && (
                <div
                  className="room-manage-popup"
                  style={{
                    left: addPopup.x,
                    top: addPopup.y,
                  }}
                >
                  <form onSubmit={handleAddRoom}>
                    <div>
                      <b>좌표:</b> ({addPopup.x}, {addPopup.y})
                    </div>
                    <input
                      type="text"
                      placeholder="강의실명"
                      value={addForm.room_name}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          room_name: e.target.value,
                        }))
                      }
                      required
                      style={{ width: "100%", margin: "8px 0" }}
                    />
                    <input
                      type="text"
                      placeholder="강의실 설명"
                      value={addForm.room_desc}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          room_desc: e.target.value,
                        }))
                      }
                      style={{ width: "100%", marginBottom: 8 }}
                    />
                    <input type="hidden" value={addPopup.x} readOnly />
                    <input type="hidden" value={addPopup.y} readOnly />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="submit" disabled={addLoading}>
                        {addLoading ? "저장 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddPopup(null)}
                        style={{ background: "#bbb" }}
                      >
                        취소
                      </button>
                    </div>
                    {addMsg && (
                      <div
                        style={{
                          color: addMsg.includes("추가") ? "green" : "red",
                          marginTop: 8,
                        }}
                      >
                        {addMsg}
                      </div>
                    )}
                  </form>
                </div>
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
