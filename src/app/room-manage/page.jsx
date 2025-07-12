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

  const [svgNodes, setSvgNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)

  // 페이징
  const totalRooms = rooms.length
  const totalPages = Math.ceil(totalRooms / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const pagedRooms = rooms.slice(startIdx, endIdx)

  // SVG 노드 파싱 함수
  const parseSvgNodes = (svgXml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const nodes = []

    // Navigation_Nodes 레이어 찾기
    const navigationLayer =
      doc.querySelector('g[id="Navigation_Nodes"]') ||
      doc.querySelector('g[id="navigation_nodes"]') ||
      doc.querySelector('g[id="Navigation_nodes"]') ||
      doc.querySelector('g[id="navigation-nodes"]')

    if (!navigationLayer) {
      console.warn("Navigation_Nodes 레이어를 찾을 수 없습니다.")
      return []
    }

    // Navigation_Nodes 레이어 내의 id가 있는 요소들만 찾기
    const allElements = navigationLayer.querySelectorAll("*[id]")

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
        layer: "Navigation_Nodes",
      })
    })

    return nodes
  }

  // 노드 클릭 핸들러
  const handleNodeClick = (node, event) => {
    event.stopPropagation()
    setSelectedNode(node)
    console.log("Selected node:", node)
  }

  // SVG 좌표를 화면 좌표로 변환하는 함수
  const svgToScreenCoords = (svgX, svgY) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 }

    const container = mapContainerRef.current
    const svgElement = container.querySelector("svg")

    if (!svgElement) return { x: 0, y: 0 }

    // SVG의 실제 렌더링 크기 (화면에서의 크기)
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // SVG의 viewBox 또는 실제 크기
    const viewBox = svgElement.viewBox.baseVal
    let svgWidth, svgHeight, svgMinX, svgMinY

    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
      // viewBox가 있는 경우
      svgMinX = viewBox.x
      svgMinY = viewBox.y
      svgWidth = viewBox.width
      svgHeight = viewBox.height
    } else {
      // viewBox가 없는 경우 SVG의 width, height 사용
      svgMinX = 0
      svgMinY = 0
      svgWidth = parseFloat(svgElement.getAttribute("width")) || containerWidth
      svgHeight =
        parseFloat(svgElement.getAttribute("height")) || containerHeight
    }

    // 좌표 변환: SVG 좌표를 화면 좌표로
    const scaleX = containerWidth / svgWidth
    const scaleY = containerHeight / svgHeight

    const screenX = (svgX - svgMinX) * scaleX
    const screenY = (svgY - svgMinY) * scaleY

    return { x: screenX, y: screenY }
  }

  // 크기 변환 함수 추가
  const svgToScreenSize = (svgWidth, svgHeight) => {
    if (!mapContainerRef.current) return { width: 0, height: 0 }

    const container = mapContainerRef.current
    const svgElement = container.querySelector("svg")

    if (!svgElement) return { width: 0, height: 0 }

    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    const viewBox = svgElement.viewBox.baseVal
    let svgViewWidth, svgViewHeight

    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
      svgViewWidth = viewBox.width
      svgViewHeight = viewBox.height
    } else {
      svgViewWidth =
        parseFloat(svgElement.getAttribute("width")) || containerWidth
      svgViewHeight =
        parseFloat(svgElement.getAttribute("height")) || containerHeight
    }

    const scaleX = containerWidth / svgViewWidth
    const scaleY = containerHeight / svgViewHeight

    return {
      width: svgWidth * scaleX,
      height: svgHeight * scaleY,
    }
  }

  // 렌더링할 노드 오버레이 컴포넌트 - 수정된 버전
  const renderNodeOverlays = () => {
    if (!mapContainerRef.current || svgNodes.length === 0) return null

    return svgNodes.map((node, index) => {
      const screenCoords = svgToScreenCoords(node.x, node.y)
      const screenSize = svgToScreenSize(node.width, node.height)

      return (
        <div
          key={`node-${node.id}-${index}`}
          style={{
            position: "absolute",
            left: screenCoords.x,
            top: screenCoords.y,
            width: Math.max(screenSize.width, 20),
            height: Math.max(screenSize.height, 20),
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
            pointerEvents: "auto", // 클릭 가능하도록
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
          ></span>
        </div>
      )
    })
  }

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

  // SVG 로드 useEffect 수정
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

                // Navigation_Nodes 레이어 노드 파싱
                const parsedNodes = parseSvgNodes(svgXml)
                setSvgNodes(parsedNodes)
                console.log(
                  "Navigation_Nodes 레이어에서 파싱된 노드들:",
                  parsedNodes
                )
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
                <table className="user-table center-table bordered-table">
                  <thead>
                    <tr>
                      <th>건물명</th>
                      <th>층</th>
                      <th>강의실명</th>
                      <th>강의실 설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRooms.length === 0 ? (
                      <tr>
                        <td colSpan={4}>강의실 데이터가 없습니다.</td>
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
                맵의 노드를 클릭하여 정보를 확인하거나 강의실로 추가할 수
                있습니다.
              </div>
            )}

            {/* 맵을 표시할 캔버스 영역 */}
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
              {/* 로딩 및 데이터 없음 처리 */}
              {mapLoading && (
                <div className="room-manage-canvas-placeholder">
                  맵 로딩 중...
                </div>
              )}
              {!mapLoading && (!filterBuilding || !filterFloor) && (
                <div className="room-manage-canvas-placeholder">
                  건물과 층을 선택하면 맵이 표시됩니다.
                </div>
              )}
              {!mapLoading && filterBuilding && filterFloor && !svgRaw && (
                <div className="room-manage-canvas-placeholder">
                  해당 건물/층의 맵 파일을 찾을 수 없습니다.
                </div>
              )}

              {/* SVG와 노드를 함께 렌더링하는 핵심 컨테이너 */}
              {!mapLoading &&
                svgRaw &&
                (() => {
                  const scale = Math.min(
                    CANVAS_SIZE / svgViewBox.width,
                    CANVAS_SIZE / svgViewBox.height
                  )
                  const offsetX = (CANVAS_SIZE - svgViewBox.width * scale) / 2
                  const offsetY = (CANVAS_SIZE - svgViewBox.height * scale) / 2

                  return (
                    <div
                      ref={mapContainerRef}
                      style={{
                        width: svgViewBox.width,
                        height: svgViewBox.height,
                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                        transformOrigin: "top left",
                        position: "relative",
                      }}
                    >
                      {/* 레이어 1: SVG 배경 */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                        }}
                        dangerouslySetInnerHTML={{ __html: svgRaw }}
                      />

                      {/* 레이어 2: 노드 오버레이 */}
                      {svgNodes.map((node, index) => (
                        <div
                          key={`node-overlay-${node.id}-${index}`}
                          style={{
                            position: "absolute",

                            // ★★★ 여기가 최종 수정된 핵심입니다! ★★★
                            // SVG 중심 좌표(node.x, node.y)를 div의 좌상단 좌표로 보정
                            left: `${node.x - node.width / 2}px`,
                            top: `${node.y - node.height / 2}px`,

                            width: `${node.width}px`,
                            height: `${node.height}px`,

                            // 시각적 스타일
                            border:
                              selectedNode?.id === node.id
                                ? "2px solid #ff4757"
                                : "1px solid #007bff",
                            backgroundColor:
                              selectedNode?.id === node.id
                                ? "rgba(255, 71, 87, 0.3)"
                                : "rgba(0, 123, 255, 0.1)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "#333",
                            fontWeight: "bold",
                          }}
                          onClick={(e) => handleNodeClick(node, e)}
                          title={`ID: ${node.id}`}
                        ></div>
                      ))}
                    </div>
                  )
                })()}
            </div>

            {/* 선택된 노드 정보 및 전체 노드 목록 UI (기존과 동일) */}
            {selectedNode && (
              <div className="selected-node-info">
                <h4>선택된 노드 정보</h4>
                <div className="node-info-grid">
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
                  className="deselect-button"
                >
                  선택 해제
                </button>
              </div>
            )}
            {svgNodes.length > 0 && (
              <div className="node-list-container">
                <h4>SVG 노드 목록 ({svgNodes.length}개)</h4>
                <div className="node-list-grid">
                  {svgNodes.map((node, index) => (
                    <button
                      key={`node-list-${node.id}-${index}`}
                      onClick={() => setSelectedNode(node)}
                      className={`node-list-button ${
                        selectedNode?.id === node.id ? "selected" : ""
                      }`}
                      title={`${node.id} (${node.element})`}
                    >
                      {node.id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
