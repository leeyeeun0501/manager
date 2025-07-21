// room-manage
"use client"
import "../globals.css"
import React, { useRef, useState, useEffect } from "react"
import Menu from "../components/menu"
import styles from "./room-manage.module.css"
import { MdEditSquare } from "react-icons/md"

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

  // 강의실 수정 모달 관련
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

  // 엣지 연결 관련 상태
  const [edgeStep, setEdgeStep] = useState(0)
  const [edgeConnectMode, setEdgeConnectMode] = useState(false)
  const [edgeFromNode, setEdgeFromNode] = useState(null)
  const [edgeToNode, setEdgeToNode] = useState(null)
  const [showEdgeModal, setShowEdgeModal] = useState(false)
  const [edgeModalNode, setEdgeModalNode] = useState(null)
  const [edgeConnectLoading, setEdgeConnectLoading] = useState(false)
  const [showEdgeConnectModal, setShowEdgeConnectModal] = useState(false)

  // 팝업 메시지 상태
  const [toastMessage, setToastMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)

  // SVG 노드
  const [svgNodes, setSvgNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)

  // 기타
  const CANVAS_SIZE = 600
  const mapContainerRef = useRef(null)

  // 토스트 메시지 함수
  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), duration)
  }

  // 페이징
  const totalRooms = rooms.length
  const totalPages = Math.ceil(totalRooms / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const pagedRooms = rooms.slice(startIdx, endIdx)

  const [roomNodes, setRoomNodes] = useState({})
  const [edges, setEdges] = useState([])

  const [stairsList, setStairsList] = useState([])
  const [stairsNodes, setStairsNodes] = useState([])
  const [stairsLoading, setStairsLoading] = useState(false)
  const [stairsError, setStairsError] = useState("")
  const [showStairsSelectModal, setShowStairsSelectModal] = useState(false)
  const [selectedStairsNode, setSelectedStairsNode] = useState(null)
  const [targetStairId, setTargetStairId] = useState("")

  const [stairsBuilding, setStairsBuilding] = useState("")
  const [stairsFloor, setStairsFloor] = useState("")
  const [stairsId, setStairsId] = useState("")

  const [showEditFieldModal, setShowEditFieldModal] = useState(false)
  const [editFieldType, setEditFieldType] = useState("")
  const [editFieldValue, setEditFieldValue] = useState("")
  const [editFieldRoom, setEditFieldRoom] = useState(null)
  const [editFieldError, setEditFieldError] = useState("")

  const [editRoomUsers, setEditRoomUsers] = useState([
    { user: "", phone: "", email: "" },
  ])

  // SVG 노드 파싱 함수
  const parseSvgNodes = (svgXml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const nodes = []

    const navigationLayer =
      doc.querySelector('g[id="Navigation_Nodes"]') ||
      doc.querySelector('g[id="navigation_nodes"]') ||
      doc.querySelector('g[id="Navigation_nodes"]') ||
      doc.querySelector('g[id="navigation-nodes"]')

    if (!navigationLayer) {
      console.warn("Navigation_Nodes 레이어를 찾을 수 없습니다.")
      return []
    }

    const allElements = navigationLayer.querySelectorAll("*[id]")

    allElements.forEach((element) => {
      const id = element.getAttribute("id")
      if (!id) return

      let x = 0,
        y = 0,
        width = 0,
        height = 0

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
          width = element.textContent ? element.textContent.length * 8 : 50
          height = 20
          break
        case "g":
          const transform = element.getAttribute("transform") || ""
          const translateMatch = transform.match(/translate\(([^)]+)\)/)
          if (translateMatch) {
            const translateValues = translateMatch[1]
              .split(/[\s,]+/)
              .map(Number)
            x = translateValues[0] || 0
            y = translateValues[1] || 0
          }
          width = height = 20
          break
        default:
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
    if (edgeConnectMode) {
      if (edgeFromNode && node.id !== edgeFromNode.id) {
        setEdgeToNode(node)
        setEdgeStep(2)
      }
      return
    }
    setSelectedNode(node)
    setEdgeModalNode({ ...node, building: filterBuilding, floor: filterFloor })
    setShowEdgeModal(true)
  }

  // SVG 처리 및 viewBox 설정
  const processSvg = (svgXml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const svgEl = doc.querySelector("svg")

    if (!svgEl) return svgXml

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

    const width = parseFloat(svgEl.getAttribute("width")) || 400
    const height = parseFloat(svgEl.getAttribute("height")) || 400

    const viewBoxStr = `0 0 ${width} ${height}`
    svgEl.setAttribute("viewBox", viewBoxStr)
    setSvgViewBox({
      x: 0,
      y: 0,
      width: width,
      height: height,
    })

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

  // 강의실 수정 핸들러
  const handleEditRoom = async () => {
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
        showToast(data.error || "수정 실패")
        return
      }
      fetchRooms(filterBuilding, filterFloor)
      setShowEditRoomModal(false)
      setEditRoom(null)
      setEditRoomName("")
      setEditRoomDesc("")
      setEditRoomOldName("")
      showToast("강의실 정보가 수정되었습니다.")
    } catch {
      showToast("수정 중 오류가 발생했습니다.")
    } finally {
      setEditRoomLoading(false)
    }
  }

  // 데이터 재로딩 함수
  const reloadMapData = () => {
    if (filterBuilding && filterFloor) {
      setMapLoading(true)
      fetch(
        `/api/map-route?building=${encodeURIComponent(
          filterBuilding
        )}&floor=${encodeURIComponent(filterFloor)}`
      )
        .then((res) => res.json())
        .then((data) => {
          const fileList = Array.isArray(data) ? data : [data]
          const svgUrl = fileList[0]?.File
          const nodesInfo = fileList[0]?.nodes || {}
          let edgesInfo = fileList[0]?.edges
          if (!edgesInfo) {
            edgesInfo = []
            Object.entries(nodesInfo).forEach(([from, arr]) => {
              arr.forEach((edgeObj) => {
                const to =
                  typeof edgeObj === "string"
                    ? edgeObj
                    : edgeObj.node || edgeObj.to
                if (to) edgesInfo.push({ from, to })
              })
            })
          }
          if (svgUrl) {
            fetch(svgUrl)
              .then((res) => res.text())
              .then((svgXml) => {
                const processedSvg = processSvg(svgXml)
                setSvgRaw(processedSvg)
                setRoomNodes(nodesInfo)
                setEdges(edgesInfo)
                const parsedNodes = parseSvgNodes(svgXml)
                setSvgNodes(parsedNodes)
              })
          }
        })
        .finally(() => setMapLoading(false))
    }
  }

  // 엣지 연결 함수
  const connectEdge = async () => {
    setEdgeConnectLoading(true)
    try {
      const res = await fetch("/api/map-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_building: filterBuilding,
          from_floor: filterFloor,
          from_node: edgeFromNode?.id,
          to_building: filterBuilding,
          to_floor: filterFloor,
          to_node: edgeToNode?.id,
        }),
      })

      const text = await res.text()
      console.log("status:", res.status, "body:", text)

      let data = {}
      try {
        data = JSON.parse(text)
      } catch (e) {}

      if (!res.ok) {
        showToast(data.error || "엣지 연결 실패")
        return
      }

      showToast("노드가 성공적으로 연결되었습니다.")
      reloadMapData()
    } catch (err) {
      showToast("서버 오류: " + (err.message || "알 수 없는 오류"))
    } finally {
      setEdgeFromNode(null)
      setEdgeToNode(null)
      setEdgeStep(0)
      setEdgeConnectLoading(false)
      setEdgeConnectMode(false)
    }
  }

  // 현재 선택된 노드의 id
  const connectedNodes = edges
    .filter((e) => getNodeSuffix(e.from) === getNodeSuffix(edgeModalNode?.id))
    .map((e) => ({
      ...e,
      otherNodeId: e.to,
      otherNodeSuffix: getNodeSuffix(e.to),
    }))

  // 엣지 연결 해제 함수
  const handleDisconnectEdge = async (targetNodeId) => {
    if (
      !edgeModalNode?.id ||
      !targetNodeId ||
      !filterBuilding ||
      !filterFloor
    ) {
      showToast("건물명, 층, 노드 정보가 올바르지 않습니다.")
      return
    }
    try {
      const res = await fetch("/api/map-route", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_building: filterBuilding,
          from_floor: filterFloor,
          from_node: getNodeSuffix(edgeModalNode.id),
          to_building: filterBuilding,
          to_floor: filterFloor,
          to_node: getNodeSuffix(targetNodeId),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "연결 해제 실패")
        return
      }
      showToast("연결이 해제되었습니다.")
      reloadMapData()
    } catch (err) {
      showToast("서버 오류: " + (err.message || "알 수 없는 오류"))
    }
  }

  // 엣지 연결
  useEffect(() => {
    if (
      edgeConnectMode &&
      edgeStep === 2 &&
      edgeFromNode &&
      edgeToNode &&
      edgeFromNode.id !== edgeToNode.id
    ) {
      connectEdge()
    }
  }, [
    edgeStep,
    edgeFromNode,
    edgeToNode,
    filterBuilding,
    filterFloor,
    edgeConnectMode,
  ])

  // 최초 건물 목록/강의실 목록
  useEffect(() => {
    fetchBuildings()
    fetchRooms()
  }, [])

  // 건물 선택 시
  useEffect(() => {
    if (!filterBuilding) {
      setFloorOptions([])
      setFilterFloor("")
      fetchRooms()
      return
    }
    fetchFloors(filterBuilding)
    fetchRooms(filterBuilding)
    setFilterFloor("")
  }, [filterBuilding])

  // 층 선택 시
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
        `/api/map-route?building=${encodeURIComponent(
          filterBuilding
        )}&floor=${encodeURIComponent(filterFloor)}`
      )
        .then((res) => res.json())
        .then((data) => {
          const fileList = Array.isArray(data) ? data : [data]
          const svgUrl = fileList[0]?.File
          const nodesInfo = fileList[0]?.nodes || {}
          let edgesInfo = fileList[0]?.edges
          if (!edgesInfo) {
            edgesInfo = []
            Object.entries(nodesInfo).forEach(([from, arr]) => {
              arr.forEach((edgeObj) => {
                const to =
                  typeof edgeObj === "string"
                    ? edgeObj
                    : edgeObj.node || edgeObj.to
                if (to) edgesInfo.push({ from, to })
              })
            })
          }

          if (svgUrl) {
            fetch(svgUrl)
              .then((res) => res.text())
              .then((svgXml) => {
                const processedSvg = processSvg(svgXml)
                setSvgRaw(processedSvg)
                setRoomNodes(nodesInfo)
                setEdges(edgesInfo)
                const parsedNodes = parseSvgNodes(svgXml)
                setSvgNodes(parsedNodes)
              })
              .catch(() => {
                setSvgRaw("")
                setRoomNodes({})
                setEdges([])
                setSvgNodes([])
              })
          } else {
            setSvgRaw("")
            setRoomNodes({})
            setEdges([])
            setSvgNodes([])
          }
        })
        .catch(() => {
          setSvgRaw("")
          setRoomNodes({})
          setEdges([]) // ★★★ 추가
          setSvgNodes([])
        })
        .finally(() => setMapLoading(false))
    } else {
      setSvgRaw("")
      setRoomNodes({})
      setEdges([])
      setSvgNodes([])
    }
  }, [filterBuilding, filterFloor])

  // 다른 층 계단 연결
  useEffect(() => {
    if (!stairsBuilding || !stairsFloor || !stairsId) {
      setStairsList([])
      setStairsNodes([])
      return
    }

    setStairsLoading(true)
    setStairsError("")

    fetch(
      `/api/stairs-route?building=${encodeURIComponent(
        stairsBuilding
      )}&floor=${encodeURIComponent(stairsFloor)}&id=${encodeURIComponent(
        stairsId
      )}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // 구조가 배열로만 오면 fallback
          setStairsList(data)
          setStairsNodes([])
          console.log("stairsList(배열):", data)
        } else if (data) {
          // stairs와 nodes 모두 처리
          setStairsList(Array.isArray(data.stairs) ? data.stairs : [])
          setStairsNodes(Array.isArray(data.nodes) ? data.nodes : [])
          console.log("stairsList(.stairs):", data.stairs)
          console.log("stairsNodes(.nodes):", data.nodes)
        } else {
          setStairsList([])
          setStairsNodes([])
          setStairsError(data.error || "계단 정보를 불러오지 못했습니다.")
          console.log("stairsList(빈 데이터):", data)
        }
      })
      .catch(() => setStairsError("계단 정보를 불러오지 못했습니다."))
      .finally(() => setStairsLoading(false))
  }, [stairsBuilding, stairsFloor, stairsId])

  // 강의실 데이터
  function normalizeRoom(room) {
    return {
      building: room.building || room.Building_Name || "",
      floor: room.floor || room.Floor_Number || "",
      name: room.name || room.Room_Name || "",
      description: room.description || room.Room_Description || "",
      room_user: room.room_user || room.Room_User || "",
      user_phone: room.user_phone || room.User_Phone || "",
      user_email: room.user_email || room.User_Email || "",
    }
  }

  function getNodeSuffix(id) {
    if (!id) return ""
    const parts = id.split("@")
    return parts[parts.length - 1]
  }

  async function connectEdgeToStairs(fromNode, toNodeInfo) {
    const { building: toBuilding, floor: toFloor, node: toNode } = toNodeInfo

    try {
      const res = await fetch("/api/map-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ✅ 건물 → 층 → 아이디 순서
          from_building: fromNode.building,
          from_floor: fromNode.floor,
          from_node: fromNode.id,

          to_building: toBuilding,
          to_floor: toFloor,
          to_node: toNode,
        }),
      })

      const text = await res.text()
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {}

      if (!res.ok) {
        showToast(data.error || "엣지 연결 실패")
        return
      }

      showToast("노드가 성공적으로 연결되었습니다.")
      reloadMapData && reloadMapData()
    } catch (err) {
      showToast("서버 오류: " + (err.message || "알 수 없는 오류"))
    }
  }

  const parseNodeInfo = (fullId) => {
    const parts = fullId.split("@")
    return {
      building: parts[0],
      floor: parts[1],
      node: parts[2],
    }
  }

  return (
    <div className={styles["room-root"]}>
      <span className={styles["room-header"]}>강의실 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles["room-content"]}>
        <div className={styles["room-manage-filter-row"]}>
          <select
            className={styles["building-select"]}
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
            className={styles["floor-select"]}
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

        <div className={styles["room-manage-main-row"]}>
          {/* 표 */}
          <div className={styles["room-manage-table-wrap"]}>
            {loading && <p>로딩 중...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
              <>
                <table
                  className={`${styles["user-table"]} ${styles["center-table"]} ${styles["bordered-table"]}`}
                >
                  <thead>
                    <tr>
                      <th>건물명</th>
                      <th>층</th>
                      <th>강의실명</th>
                      <th>강의실 설명</th>
                      <th>사용자</th>
                      <th>전화번호</th>
                      <th>이메일</th>
                      <th>수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRooms.map((room, idx) => (
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
                        <td>{room.description}</td>
                        <td>
                          {Array.isArray(room.room_user)
                            ? room.room_user.join(", ")
                            : room.room_user}
                        </td>
                        <td>{room.user_phone}</td>
                        <td>{room.user_email}</td>
                        <td>
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              marginLeft: 3,
                            }}
                            title="강의실 전체 정보 수정"
                            onClick={() => {
                              setEditRoom(room)
                              setEditRoomName(room.name)
                              setEditRoomDesc(room.description || "")
                              setEditRoomUsers(
                                Array.isArray(room.room_user)
                                  ? room.room_user.map((user, i) => ({
                                      user: user || "",
                                      phone: Array.isArray(room.user_phone)
                                        ? room.user_phone[i] || ""
                                        : room.user_phone || "",
                                      email: Array.isArray(room.user_email)
                                        ? room.user_email[i] || ""
                                        : room.user_email || "",
                                    }))
                                  : [
                                      {
                                        user: room.room_user || "",
                                        phone: room.user_phone || "",
                                        email: room.user_email || "",
                                      },
                                    ]
                              )
                              setEditRoomError("")
                              setShowEditRoomModal(true)
                            }}
                          >
                            <MdEditSquare size={20} color="#007bff" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* 페이지네이션 */}
                <div className={styles["room-manage-pagination-row"]}>
                  <button
                    className={styles["room-manage-pagination-btn"]}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  <span className={styles["room-manage-pagination-info"]}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className={styles["room-manage-pagination-btn"]}
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
          <div className={styles["room-manage-map-wrap"]}>
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
              {mapLoading && (
                <div className={styles["room-manage-canvas-placeholder"]}>
                  맵 로딩 중...
                </div>
              )}
              {!mapLoading && (!filterBuilding || !filterFloor) && (
                <div className={styles["room-manage-canvas-placeholder"]}>
                  건물과 층을 선택하면 맵이 표시됩니다.
                </div>
              )}
              {!mapLoading && filterBuilding && filterFloor && !svgRaw && (
                <div className={styles["room-manage-canvas-placeholder"]}>
                  해당 건물/층의 맵 파일을 찾을 수 없습니다.
                </div>
              )}

              {/* SVG와 노드, 엣지 표시 */}
              {!mapLoading &&
                svgRaw &&
                (() => {
                  const scale = Math.min(
                    CANVAS_SIZE / svgViewBox.width,
                    CANVAS_SIZE / svgViewBox.height
                  )
                  const offsetX = (CANVAS_SIZE - svgViewBox.width * scale) / 2
                  const offsetY = (CANVAS_SIZE - svgViewBox.height * scale) / 2

                  // id의 마지막 부분만 추출하는 함수
                  function getNodeSuffix(id) {
                    if (!id) return ""
                    const parts = id.split("@")
                    return parts[parts.length - 1]
                  }

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
                      {/* SVG 배경 */}
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
                      {/* 네비 노드 연결선 (엣지) */}
                      <svg
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: svgViewBox.width,
                          height: svgViewBox.height,
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      >
                        {/* edges 배열이 있다면, id 파싱 후 연결선 표시 */}
                        {edges &&
                          edges.map((edge, idx) => {
                            const fromSuffix = getNodeSuffix(edge.from)
                            const toSuffix = getNodeSuffix(edge.to)
                            const fromNode = svgNodes.find(
                              (node) => getNodeSuffix(node.id) === fromSuffix
                            )
                            const toNode = svgNodes.find(
                              (node) => getNodeSuffix(node.id) === toSuffix
                            )
                            if (!fromNode || !toNode) return null
                            return (
                              <line
                                key={idx}
                                x1={fromNode.x}
                                y1={fromNode.y}
                                x2={toNode.x}
                                y2={toNode.y}
                                stroke="red"
                                strokeWidth={2}
                                opacity={0.85}
                              />
                            )
                          })}
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="7"
                            markerHeight="7"
                            refX="7"
                            refY="3.5"
                            orient="auto"
                            markerUnits="strokeWidth"
                          >
                            <polygon
                              points="0 0, 7 3.5, 0 7"
                              fill="#2574f5"
                              opacity="0.8"
                            />
                          </marker>
                        </defs>
                      </svg>
                      {/* 네비 노드 오버레이(버튼) */}
                      {svgNodes.map((node, index) => (
                        <div
                          key={`node-overlay-${node.id}-${index}`}
                          style={{
                            position: "absolute",
                            left: `${node.x - node.width / 2}px`,
                            top: `${node.y - node.height / 2}px`,
                            width: `${node.width}px`,
                            height: `${node.height}px`,
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
          </div>
          {showEdgeModal && edgeModalNode && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
              }}
              onClick={() => setShowEdgeModal(false)}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 24,
                  minWidth: 280,
                  maxWidth: 350,
                  padding: 28,
                  boxShadow: "0 6px 32px rgba(0,0,0,0.18)",
                  position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h4
                  style={{
                    marginTop: 0,
                    marginBottom: 18,
                    textAlign: "center",
                    color: "#2586e5",
                    fontWeight: 700,
                    fontSize: 20,
                    borderBottom: "2px solid #2586e5",
                    display: "inline-block",
                    paddingBottom: 4,
                    lineHeight: 1.2,
                    width: "100%",
                  }}
                >
                  노드 정보
                </h4>
                <div
                  style={{
                    fontSize: 15,
                    color: "#333",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    fontFamily: "Pretendard, 'Apple SD Gothic Neo', sans-serif",
                    marginBottom: 2,
                  }}
                >
                  <strong>건물:</strong>
                  <span style={{ fontWeight: 400, marginLeft: 4 }}>
                    {edgeModalNode.building}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#333",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    fontFamily: "Pretendard, 'Apple SD Gothic Neo', sans-serif",
                    marginBottom: 2,
                  }}
                >
                  <strong>층:</strong>
                  <span style={{ fontWeight: 400, marginLeft: 4 }}>
                    {edgeModalNode.floor}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#333",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    fontFamily: "Pretendard, 'Apple SD Gothic Neo', sans-serif",
                    marginBottom: 2,
                  }}
                >
                  <strong>ID:</strong>
                  <span style={{ fontWeight: 400, marginLeft: 4 }}>
                    {edgeModalNode.id}
                  </span>
                </div>
                {/* 연결된 노드 목록 */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                    연결된 노드
                  </div>
                  {connectedNodes.length === 0 ? (
                    <div style={{ color: "#888" }}>연결된 노드 없음</div>
                  ) : (
                    connectedNodes.map((edge, idx) => (
                      <button
                        key={`${edge.otherNodeId}-${idx}`}
                        onClick={() => handleDisconnectEdge(edge.otherNodeId)}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 20,
                          border: "none",
                          fontSize: 15,
                          fontWeight: 700,
                          background: "#ffa500",
                          color: "#fff",
                          cursor: "pointer",
                          marginRight: 8,
                          marginBottom: 8,
                          marginTop: 3,
                          minWidth: 67,
                          textAlign: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                        }}
                      >
                        {edge.otherNodeSuffix} 엣지 연결 해제
                      </button>
                    ))
                  )}
                </div>
                {/* 기존 버튼들 */}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                    marginTop: 16,
                  }}
                >
                  <button
                    onClick={() => setShowEdgeModal(false)}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#eee",
                      color: "#333",
                      cursor: "pointer",
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      setEdgeFromNode(edgeModalNode)
                      setShowEdgeModal(false)
                      setEdgeConnectMode(true)
                      setEdgeToNode(null)
                    }}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#0070f3",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    엣지 연결
                  </button>
                  {/*  계단 노드에서만 노출되는 버튼 */}
                  {edgeModalNode?.id?.includes("stairs") && (
                    <button
                      onClick={() => {
                        console.log(
                          "클릭됨: building =",
                          edgeModalNode.building
                        )
                        setStairsBuilding(edgeModalNode.building)
                        setStairsFloor(edgeModalNode.floor)
                        setStairsId(edgeModalNode.id)
                        setSelectedStairsNode(edgeModalNode)
                        setShowStairsSelectModal(true)
                      }}
                      style={{
                        padding: "10px 22px",
                        borderRadius: 24,
                        border: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        background: "#1976d2",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      다른 층으로 이동
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* stairs 연결 선택 모달 */}
          {showStairsSelectModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1500,
              }}
              onClick={() => setShowStairsSelectModal(false)}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  minWidth: 320,
                  maxWidth: "95vw",
                  padding: "32px 28px 24px 28px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.13)",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 타이틀 */}
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "#1976d2",
                    marginBottom: 16,
                    textAlign: "center",
                    borderBottom: "2px solid #1976d2",
                    paddingBottom: 7,
                  }}
                >
                  다른 층 계단 연결
                </div>

                {/* 상태별 처리 */}
                {stairsLoading ? (
                  <div style={{ textAlign: "center", margin: 18 }}>
                    계단 목록을 불러오는 중...
                  </div>
                ) : stairsError ? (
                  <div
                    style={{
                      color: "#e74c3c",
                      textAlign: "center",
                      margin: 12,
                    }}
                  >
                    {stairsError}
                  </div>
                ) : (
                  <>
                    {/* Select: 연결할 계단 선택 */}
                    <select
                      value={targetStairId || ""}
                      onChange={(e) => setTargetStairId(e.target.value)}
                      style={{
                        width: "100%",
                        height: 46,
                        fontSize: 15,
                        border: "1.3px solid #b3d1fa",
                        borderRadius: 11,
                        padding: "6px 15px",
                        marginBottom: 24,
                        outline: "none",
                      }}
                    >
                      <option value="">연결할 계단 선택</option>
                      {stairsList
                        .filter((id) => id !== (selectedStairsNode?.id || ""))
                        .map((id) => {
                          const parts = id.split("@")
                          const floor = parts[1] || ""
                          const stairName = parts[2] || ""
                          return (
                            <option key={id} value={id}>
                              {floor}층 - {stairName}
                            </option>
                          )
                        })}
                    </select>

                    {/* 🟡 stairsNodes 목록 표시 */}
                    {stairsNodes.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: 8,
                            fontSize: 14,
                            color: "#555",
                          }}
                        >
                          연결된 계단 목록
                        </div>
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                            maxHeight: 160,
                            overflowY: "auto",
                          }}
                        >
                          {stairsNodes.map((node) => (
                            <li
                              key={node.id}
                              style={{
                                padding: "6px 10px",
                                background: "#f1f1f1",
                                borderRadius: 8,
                                marginBottom: 6,
                                fontSize: 14,
                                color: "#333",
                              }}
                            >
                              {node.floor}층 - {node.name || node.id}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* 버튼 영역 */}
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 19,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#eee",
                      color: "#222",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setShowStairsSelectModal(false)
                      setTargetStairId("")
                      setSelectedStairsNode(null)
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedStairsNode || !targetStairId) return

                      const parsedTarget = parseNodeInfo(targetStairId) // 건물, 층, 아이디 파싱

                      await connectEdgeToStairs(
                        selectedStairsNode, // fromNode
                        parsedTarget // toNodeInfo
                      )

                      setTargetStairId("")
                      setShowStairsSelectModal(false)
                      setSelectedStairsNode(null)
                    }}
                    disabled={!targetStairId}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#0070f3",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    엣지 연결
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* 두 번째 노드 선택 안내 모달 */}
          {showEdgeConnectModal && edgeFromNode && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: "32px 24px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.15)",
                  minWidth: "320px",
                  textAlign: "center",
                }}
              >
                <h3>엣지 연결</h3>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  {filterBuilding} {filterFloor} {edgeFromNode.id}에서 연결할
                  노드를 선택하세요.
                </div>
                <div style={{ color: "#007bff", marginBottom: 10 }}>
                  지도에서 <b>다른 노드</b>를 클릭하세요.
                </div>
                <button
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setShowEdgeConnectModal(false)
                    setEdgeStep(0)
                    setEdgeFromNode(null)
                    setEdgeToNode(null)
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
          {/* 토스트 메시지 UI */}
          {toastVisible && (
            <div
              style={{
                position: "fixed",
                top: 30,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#333",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 8,
                zIndex: 3000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                fontWeight: "bold",
              }}
            >
              {toastMessage}
            </div>
          )}
        </div>
      </div>
      {/* 강의실 정보 수정 모달 */}
      {showEditRoomModal && editRoom && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.13)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowEditRoomModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              minWidth: 380,
              maxWidth: "96vw",
              padding: "36px 32px 29px 32px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 타이틀 */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#1976d2",
                marginBottom: 19,
                textAlign: "center",
                borderBottom: "2px solid #1976d2",
                paddingBottom: 7,
                letterSpacing: "-0.5px",
              }}
            >
              강의실 전체 정보 수정
            </div>
            {/* 강의실 정보 한 줄 */}
            <div
              style={{
                color: "#495057",
                fontWeight: 500,
                fontSize: 15.5,
                textAlign: "center",
                marginBottom: 13,
              }}
            >
              {editRoom.building} / {editRoom.floor} / {editRoom.name}
            </div>
            {/* 강의실 설명 */}
            <input
              value={editRoomDesc}
              onChange={(e) => setEditRoomDesc(e.target.value)}
              placeholder="강의실 설명"
              style={{
                width: "100%",
                height: 44,
                padding: "0 12px",
                borderRadius: 12,
                border: "1.5px solid #b3d1fa",
                fontSize: 16,
                marginBottom: 13,
                background: "#f7fbff",
                color: "#222",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {/* 사용자/전화/이메일 한 세트 행별 입력 + 삭제 버튼 */}
            {editRoomUsers.map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 9, marginBottom: 11 }}
              >
                <input
                  value={item.user}
                  onChange={(e) => {
                    const arr = [...editRoomUsers]
                    arr[i].user = e.target.value
                    setEditRoomUsers(arr)
                  }}
                  placeholder={`사용자${
                    editRoomUsers.length > 1 ? ` ${i + 1}` : ""
                  }`}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 11,
                    border: "1.3px solid #b3d1fa",
                    fontSize: 15.5,
                    background: "#fff",
                    color: "#222",
                  }}
                />
                <input
                  value={item.phone}
                  onChange={(e) => {
                    const arr = [...editRoomUsers]
                    arr[i].phone = e.target.value
                    setEditRoomUsers(arr)
                  }}
                  placeholder="전화번호"
                  style={{
                    flex: 1.27,
                    padding: "8px 10px",
                    borderRadius: 11,
                    border: "1.3px solid #b3d1fa",
                    fontSize: 15.5,
                    background: "#fff",
                    color: "#222",
                  }}
                />
                <input
                  value={item.email}
                  onChange={(e) => {
                    const arr = [...editRoomUsers]
                    arr[i].email = e.target.value
                    setEditRoomUsers(arr)
                  }}
                  placeholder="이메일"
                  style={{
                    flex: 1.27,
                    padding: "8px 10px",
                    borderRadius: 11,
                    border: "1.3px solid #b3d1fa",
                    fontSize: 15.5,
                    background: "#fff",
                    color: "#222",
                  }}
                />
                <button
                  onClick={() => {
                    if (editRoomUsers.length === 1) return
                    setEditRoomUsers((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }}
                  style={{
                    marginLeft: 3,
                    background: "#f8d7da",
                    color: "#a94442",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    padding: "0 11px",
                    fontWeight: 700,
                    fontSize: 19,
                    height: 36,
                    alignSelf: "center",
                  }}
                  title="삭제"
                  type="button"
                >
                  －
                </button>
              </div>
            ))}
            {/* + 추가 버튼 */}
            <button
              type="button"
              onClick={() =>
                setEditRoomUsers((prev) => [
                  ...prev,
                  { user: "", phone: "", email: "" },
                ])
              }
              style={{
                margin: "5px 0 16px 0",
                background: "#e3f2fd",
                color: "#1976d2",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                padding: "6px 0",
                fontWeight: 600,
                width: "100%",
                fontSize: 15,
              }}
            >
              + 사용자 추가
            </button>
            {/* 에러 메시지 */}
            {editRoomError && (
              <div
                style={{
                  color: "#e74c3c",
                  fontSize: 15,
                  marginBottom: 9,
                  textAlign: "center",
                }}
              >
                {editRoomError}
              </div>
            )}
            {/* 저장/취소 버튼 */}
            <div
              style={{ display: "flex", gap: 10, marginTop: 7, width: "100%" }}
            >
              <button
                onClick={() => setShowEditRoomModal(false)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 24,
                  background: "#efefef",
                  color: "#333",
                  fontWeight: 600,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                  marginRight: 2,
                }}
                type="button"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  // 값 검증 등 필요시 추가!
                  try {
                    const users = editRoomUsers.map((u) => u.user)
                    const phones = editRoomUsers.map((u) => u.phone)
                    const emails = editRoomUsers.map((u) => u.email)
                    const res = await fetch(
                      `/api/room-route/${encodeURIComponent(
                        editRoom.building
                      )}/${encodeURIComponent(editRoom.floor)}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          room_name: editRoomName,
                          room_desc: editRoomDesc,
                          room_user: users,
                          user_phone: phones,
                          user_email: emails,
                        }),
                      }
                    )
                    if (!res.ok) throw new Error()
                    setShowEditRoomModal(false)
                    if (typeof fetchRooms === "function")
                      fetchRooms(filterBuilding, filterFloor)
                  } catch {
                    setEditRoomError("수정 중 오류가 발생했습니다.")
                  }
                }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 24,
                  background: "#2574f5",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                  marginLeft: 2,
                }}
                type="button"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
