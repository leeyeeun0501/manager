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

  const CANVAS_SIZE = 600
  const mapContainerRef = useRef(null)

  const normalizeRoom = (room) => {
    return {
      building: room.building || room.Building_Name || "",
      floor: room.floor || room.Floor_Number || "",
      name: room.name || room.Room_Name || "",
      description: room.description || room.Room_Description || "",
    }
  }

  const [svgNodes, setSvgNodes] = useState([]) // 파싱된 노드들
  const [selectedNode, setSelectedNode] = useState(null) // 선택된 노드

  // SVG 노드 파싱 함수
  const parseSvgNodes = (svgXml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const nodes = []

    // 모든 요소를 순회하면서 id가 있는 요소들 찾기
    const allElements = doc.querySelectorAll("*[id]")

    allElements.forEach((element) => {
      const id = element.getAttribute("id")
      if (!id) return

      // 요소의 위치 정보 가져오기
      let x = 0,
        y = 0,
        width = 0,
        height = 0

      // 각 요소 타입별로 위치 정보 추출
      switch (element.tagName.toLowerCase()) {
        case "rect":
          x = parseFloat(element.getAttribute("x") || 0)
          y = parseFloat(element.getAttribute("y") || 0)
          width = parseFloat(element.getAttribute("width") || 0)
          height = parseFloat(element.getAttribute("height") || 0)
          break
        case "circle":
          x = parseFloat(element.getAttribute("cx") || 0)
          y = parseFloat(element.getAttribute("cy") || 0)
          width = height = parseFloat(element.getAttribute("r") || 0) * 2
          break
        case "ellipse":
          x = parseFloat(element.getAttribute("cx") || 0)
          y = parseFloat(element.getAttribute("cy") || 0)
          width = parseFloat(element.getAttribute("rx") || 0) * 2
          height = parseFloat(element.getAttribute("ry") || 0) * 2
          break
        case "line":
          x = parseFloat(element.getAttribute("x1") || 0)
          y = parseFloat(element.getAttribute("y1") || 0)
          const x2 = parseFloat(element.getAttribute("x2") || 0)
          const y2 = parseFloat(element.getAttribute("y2") || 0)
          width = Math.abs(x2 - x)
          height = Math.abs(y2 - y)
          break
        case "polygon":
        case "polyline":
          const points = element.getAttribute("points") || ""
          const pointsArray = points
            .split(/[\s,]+/)
            .filter((p) => p)
            .map(Number)
          if (pointsArray.length >= 2) {
            const xCoords = pointsArray.filter((_, i) => i % 2 === 0)
            const yCoords = pointsArray.filter((_, i) => i % 2 === 1)
            x = Math.min(...xCoords)
            y = Math.min(...yCoords)
            width = Math.max(...xCoords) - x
            height = Math.max(...yCoords) - y
          }
          break
        case "path":
          // path의 경우 getBBox()를 사용해야 하지만, 여기서는 간단히 처리
          const d = element.getAttribute("d") || ""
          const matches = d.match(/[ML]\s*([0-9.-]+)\s*,?\s*([0-9.-]+)/g)
          if (matches && matches.length > 0) {
            const coords = matches.map((m) => {
              const nums = m
                .replace(/[ML]\s*/, "")
                .split(/[\s,]+/)
                .map(Number)
              return { x: nums[0] || 0, y: nums[1] || 0 }
            })
            const xCoords = coords.map((c) => c.x)
            const yCoords = coords.map((c) => c.y)
            x = Math.min(...xCoords)
            y = Math.min(...yCoords)
            width = Math.max(...xCoords) - x
            height = Math.max(...yCoords) - y
          }
          break
        case "text":
          x = parseFloat(element.getAttribute("x") || 0)
          y = parseFloat(element.getAttribute("y") || 0)
          width = element.textContent ? element.textContent.length * 8 : 50 // 대략적인 텍스트 크기
          height = 20
          break
        case "g":
          // 그룹의 경우 transform 속성에서 translate 값 추출
          const transform = element.getAttribute("transform") || ""
          const translateMatch = transform.match(/translate\(([^)]+)\)/)
          if (translateMatch) {
            const translateValues = translateMatch[1]
              .split(/[\s,]+/)
              .map(Number)
            x = translateValues[0] || 0
            y = translateValues[1] || 0
          }
          width = height = 20 // 그룹은 기본 크기
          break
        default:
          // 기본적으로 x, y 속성이 있는지 확인
          x = parseFloat(element.getAttribute("x") || 0)
          y = parseFloat(element.getAttribute("y") || 0)
          width = parseFloat(element.getAttribute("width") || 20)
          height = parseFloat(element.getAttribute("height") || 20)
      }

      nodes.push({
        id,
        x,
        y,
        width,
        height,
        element: element.tagName.toLowerCase(),
        layer: element.closest("g")?.getAttribute("id") || "default",
      })
    })

    return nodes
  }

  // SVG 로드 useEffect 수정 (기존 코드에서 수정)
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

                // 노드 파싱 추가
                const parsedNodes = parseSvgNodes(svgXml)
                setSvgNodes(parsedNodes)
                console.log("Parsed SVG nodes:", parsedNodes)
              })
              .catch(() => {
                setSvgRaw("")
                setSvgNodes([])
              })
          } else {
            setSvgRaw("")
            setSvgNodes([])
          }
        })
        .catch(() => {
          setSvgRaw("")
          setSvgNodes([])
        })
        .finally(() => setMapLoading(false))
    } else {
      setSvgRaw("")
      setSvgNodes([])
    }
  }, [filterBuilding, filterFloor])

  // 노드 클릭 핸들러
  const handleNodeClick = (node, event) => {
    event.stopPropagation()
    setSelectedNode(node)
    console.log("Selected node:", node)
  }

  // SVG 좌표를 화면 좌표로 변환하는 함수
  const svgToScreenCoords = (svgX, svgY) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 }

    const rect = mapContainerRef.current.getBoundingClientRect()
    const screenX = ((svgX - svgViewBox.x) / svgViewBox.width) * rect.width
    const screenY = ((svgY - svgViewBox.y) / svgViewBox.height) * rect.height

    return { x: screenX, y: screenY }
  }

  // 렌더링할 노드 오버레이 컴포넌트
  const renderNodeOverlays = () => {
    if (!mapContainerRef.current || svgNodes.length === 0) return null

    return svgNodes.map((node, index) => {
      const screenCoords = svgToScreenCoords(node.x, node.y)
      const screenSize = svgToScreenCoords(node.width, node.height)

      return (
        <div
          key={`node-${node.id}-${index}`}
          style={{
            position: "absolute",
            left: screenCoords.x,
            top: screenCoords.y,
            width: Math.max(screenSize.x, 20),
            height: Math.max(screenSize.y, 20),
            border:
              selectedNode?.id === node.id
                ? "2px solid #ff0000"
                : "1px solid #007bff",
            backgroundColor:
              selectedNode?.id === node.id
                ? "rgba(255, 0, 0, 0.2)"
                : "rgba(0, 123, 255, 0.1)",
            cursor: "pointer",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#333",
            fontWeight: "bold",
            textAlign: "center",
            overflow: "hidden",
            zIndex: 10,
            transition: "all 0.2s ease",
          }}
          onClick={(e) => handleNodeClick(node, e)}
          title={`ID: ${node.id}, Layer: ${node.layer}, Type: ${node.element}`}
        >
          <span
            style={{
              fontSize: "8px",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.id}
          </span>
        </div>
      )
    })
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
                style={{
                  position: "relative",
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE,
                  border: "1px solid #ddd",
                  backgroundColor: "#f8f9fa",
                  overflow: "hidden",
                }}
              >
                <div
                  ref={mapContainerRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    cursor: "crosshair",
                    position: "relative",
                  }}
                  onClick={handleMapClick}
                  dangerouslySetInnerHTML={{ __html: svgRaw }}
                />
                {/* 노드 오버레이 */}
                {renderNodeOverlays()}
              </div>
            )}
            {selectedNode && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: 8,
                  maxWidth: CANVAS_SIZE,
                }}
              >
                <h4>선택된 노드 정보</h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <strong>ID:</strong> {selectedNode.id}
                  </div>
                  <div>
                    <strong>레이어:</strong> {selectedNode.layer}
                  </div>
                  <div>
                    <strong>타입:</strong> {selectedNode.element}
                  </div>
                  <div>
                    <strong>위치:</strong> ({selectedNode.x.toFixed(1)},{" "}
                    {selectedNode.y.toFixed(1)})
                  </div>
                  <div>
                    <strong>크기:</strong> {selectedNode.width.toFixed(1)} ×{" "}
                    {selectedNode.height.toFixed(1)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{
                    marginTop: 8,
                    padding: "4px 8px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  선택 해제
                </button>
              </div>
            )}
            {svgNodes.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: 8,
                }}
              >
                <h4>SVG 노드 목록 ({svgNodes.length}개)</h4>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {svgNodes.map((node, index) => (
                    <button
                      key={`node-list-${node.id}-${index}`}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor:
                          selectedNode?.id === node.id ? "#007bff" : "#e9ecef",
                        color: selectedNode?.id === node.id ? "white" : "#333",
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "12px",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={`${node.id} (${node.element})`}
                    >
                      {node.id}
                    </button>
                  ))}
                </div>
              </div>
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
