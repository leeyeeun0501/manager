// 강의실 관리
"use client"
import "../globals.css"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import styles from "./room-manage.module.css"
import { apiGet, apiPost, apiPut, apiDelete, parseJsonResponse, extractDataList } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"
import { useToast } from "../utils/useToast"
import { useSearchFilter } from "../utils/useSearchFilter"
import { usePagination } from "../utils/usePagination"

import RoomTable from "./RoomTable"
import MapViewer from "./MapViewer"
import EdgeModal from "./EdgeModal"
import StairsModal from "./StairsModal"
import EdgeConnectModal from "./EdgeConnectModal"
import EditRoomModal from "./EditRoomModal"
export default function RoomManagePage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const router = useRouter()
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

  // 토스트 메시지 훅
  const { toastMessage, toastVisible, showToast } = useToast()

  // 검색 필터링 훅
  const { search, setSearch, filteredData: filteredRooms } = useSearchFilter(rooms)

  // 페이징 훅
  const itemsPerPage = 10
  const { currentPage, totalPages, pagedData: pagedRooms, setCurrentPage, goToPrevPage, goToNextPage } = usePagination(
    filteredRooms,
    itemsPerPage
  )

  // SVG 노드
  const [svgNodes, setSvgNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const CANVAS_SIZE = 600

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

  const [editRoomUsers, setEditRoomUsers] = useState([
    { user: "", phone: "", email: "" },
  ])

  // SVG 노드 파싱 함수
  const parseSvgNodes = useCallback((svgXml, building, floor) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const nodes = []

    const navigationLayer =
      doc.querySelector('g[id="Navigation_Nodes"]') ||
      doc.querySelector('g[id="navigation_nodes"]') ||
      doc.querySelector('g[id="Navigation_nodes"]') ||
      doc.querySelector('g[id="navigation-nodes"]')

    if (!navigationLayer) {
      return []
    }

    const allElements = navigationLayer.querySelectorAll("*[id]")

    allElements.forEach((element) => {
      const nodeSuffix = element.getAttribute("id")
      if (!nodeSuffix) return

      // 전체 노드 ID 생성 (Building@Floor@node_id 형식)
      const fullNodeId = `${building}@${floor}@${nodeSuffix}`

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
        id: fullNodeId,
        x,
        y,
        width,
        height,
        element: element.tagName.toLowerCase(),
        layer: "Navigation_Nodes",
      })
    })

    return nodes
  }, [])

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback((node, event) => {
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
  }, [edgeConnectMode, edgeFromNode, filterBuilding, filterFloor])

  // SVG 처리 및 viewBox 설정 (순수 함수로 변경)
  const processSvg = useCallback((svgXml) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const svgEl = doc.querySelector("svg")

    if (!svgEl) {
      return { svg: svgXml, viewBox: { x: 0, y: 0, width: 400, height: 400 } }
    }

    const existingViewBox = svgEl.getAttribute("viewBox")
    if (existingViewBox) {
      const parts = existingViewBox.split(/[\s,]+/).map(Number)
      if (parts.length === 4) {
        return {
          svg: svgXml,
          viewBox: {
            x: parts[0],
            y: parts[1],
            width: parts[2],
            height: parts[3],
          },
        }
      }
    }

    const width = parseFloat(svgEl.getAttribute("width")) || 400
    const height = parseFloat(svgEl.getAttribute("height")) || 400

    const viewBoxStr = `0 0 ${width} ${height}`
    svgEl.setAttribute("viewBox", viewBoxStr)
    const viewBox = {
      x: 0,
      y: 0,
      width: width,
      height: height,
    }

    svgEl.removeAttribute("width")
    svgEl.removeAttribute("height")

    return { svg: doc.documentElement.outerHTML, viewBox }
  }, [])

  // 건물 목록
  const fetchBuildings = useCallback(async () => {
    try {
      const res = await apiGet("/api/building-route")
      const data = await parseJsonResponse(res)
      const allBuildings = data.all || []
      setBuildingOptions(
        allBuildings
          .filter((b) => b && b.Building_Name)
          .map((b) => b.Building_Name)
      )
    } catch {
      setBuildingOptions([])
    }
  }, [])

  // 층 목록
  const fetchFloors = useCallback(async (building) => {
    if (!building) {
      setFloorOptions([])
      return
    }
    try {
      const res = await apiGet(
        `/api/floor-route?building=${encodeURIComponent(building)}&type=names`
      )
      const data = await parseJsonResponse(res)
      const floors = data.floors || []
      setFloorOptions(Array.isArray(floors) ? floors : [])
    } catch {
      setFloorOptions([])
    }
  }, [])

  // 강의실 데이터 정규화 함수
  const normalizeRoom = useCallback((room) => {
    return {
      building: room.building || room.Building_Name || "",
      floor: room.floor || room.Floor_Number || "",
      name: room.name || room.Room_Name || "",
      description: room.description || room.Room_Description || "",
      room_user: room.room_user || room.Room_User || "",
      user_phone: room.user_phone || room.User_Phone || "",
      user_email: room.user_email || room.User_Email || "",
    }
  }, [])

  // 강의실 정보: 전체/건물/건물+층 조회
  const fetchRooms = useCallback(async (building, floor) => {
    setLoading(true)
    setError("")
    try {
      let url = "/api/room-route"
      if (building && floor) {
        url += `/${encodeURIComponent(building)}/${encodeURIComponent(floor)}`
      } else if (building) {
        url += `/${encodeURIComponent(building)}`
      }

      const res = await apiGet(url)
      const data = await parseJsonResponse(res)
      
      // extractDataList 유틸리티 사용
      const roomList = extractDataList(data, 'rooms')

      const mapped = roomList.map(normalizeRoom)
      setRooms(mapped)
    } catch (err) {
      setError(err.message)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [normalizeRoom]) // normalizeRoom 함수를 의존성 배열에 추가

  // 데이터 재로딩 함수
  const reloadMapData = useCallback(() => {
    if (filterBuilding && filterFloor) {
      setMapLoading(true)

      // 상태 초기화: 이전 노드/엣지 완전 비우기
      setSvgRaw("")
      setSvgNodes([])
      setRoomNodes({})
      setEdges([])

      apiGet(
        `/api/map-route?building=${encodeURIComponent(
          filterBuilding
        )}&floor=${encodeURIComponent(filterFloor)}`
      )
        .then(async (res) => parseJsonResponse(res))
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
            // 캐시 무력화
            const cacheBustUrl =
              svgUrl + (svgUrl.includes("?") ? "&" : "?") + "ts=" + Date.now()
            fetch(cacheBustUrl)
              .then((res) => res.text())
              .then((svgXml) => {
                const { svg: processedSvg, viewBox } = processSvg(svgXml)
                setSvgRaw(processedSvg)
                setSvgViewBox(viewBox)
                setRoomNodes(nodesInfo)
                setEdges(edgesInfo)
                const parsedNodes = parseSvgNodes(
                  svgXml,
                  filterBuilding,
                  filterFloor
                )
                setSvgNodes(parsedNodes)
              })
              .catch(() => {
                // 에러 처리
              })
          }
        })
        .finally(() => setMapLoading(false))
    }
  }, [filterBuilding, filterFloor, processSvg, parseSvgNodes])

  // @ 파싱
  const getNodeSuffix = useCallback((id) => {
    if (!id) return ""
    const parts = id.split("@")
    return parts[parts.length - 1]
  }, [])

  // 노드 정보 파싱
  const parseNodeInfo = useCallback((fullId) => {
    if (!fullId) {
      return {
        building: "",
        floor: "",
        node: "",
      }
    }

    const parts = fullId.split("@")

    if (parts.length < 3) {
      return {
        building: "",
        floor: "",
        node: "",
      }
    }

    return {
      building: parts[0],
      floor: parts[1],
      node: parts[2],
    }
  }, [])

  // 중복 엣지 체크
  const isEdgeDuplicate = useCallback((edges, fromId, toId) => {
    const fromInfo = parseNodeInfo(fromId)
    const toInfo = parseNodeInfo(toId)

    return edges.some((e) => {
      const eFromInfo = parseNodeInfo(e.from)
      const eToInfo = parseNodeInfo(e.to)
  
      return (
        eFromInfo.building === fromInfo.building &&
        eFromInfo.floor === fromInfo.floor &&
        eFromInfo.node === fromInfo.node &&
        eToInfo.building === toInfo.building &&
        eToInfo.floor === toInfo.floor &&
        eToInfo.node === toInfo.node
      )
    })
  }, [parseNodeInfo])

  // 내부 도면 엣지 연결 함수
  const connectEdge = useCallback(async () => {
    if (isEdgeDuplicate(edges, edgeFromNode?.id, edgeToNode?.id)) {
      showToast("이미 연결된 엣지입니다.")
      setEdgeFromNode(null)
      setEdgeToNode(null)
      setEdgeStep(0)
      setEdgeConnectLoading(false)
      setEdgeConnectMode(false)
      return
    }

    setEdgeConnectLoading(true)
    try {
      const res = await apiPost("/api/map-route", {
        from_building: filterBuilding,
        from_floor: filterFloor,
        from_node: getNodeSuffix(edgeFromNode?.id),
        to_building: filterBuilding,
        to_floor: filterFloor,
        to_node: getNodeSuffix(edgeToNode?.id),
      })

      const data = await parseJsonResponse(res)

      if (!res.ok) {
        showToast(data.error || "엣지 연결 실패")
        return
      }

      showToast(data.message || "노드가 성공적으로 연결되었습니다.")
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
  }, [edges, edgeFromNode, edgeToNode, filterBuilding, filterFloor, reloadMapData, isEdgeDuplicate, getNodeSuffix, showToast])

  // 현재 선택된 노드의 id
  const connectedNodes = useMemo(() => {
    if (!edgeModalNode?.id) return []
    return edges
      .filter((e) => getNodeSuffix(e.from) === getNodeSuffix(edgeModalNode.id))
      .map((e) => ({
        ...e,
        otherNodeId: e.to,
        otherNodeSuffix: getNodeSuffix(e.to),
      }))
  }, [edges, edgeModalNode?.id, getNodeSuffix])

  // 내부 도면 엣지 연결 해제 함수
  const handleDisconnectEdge = useCallback(async (targetNodeId) => {
    if (!edgeModalNode?.id || !targetNodeId) {
      showToast("노드 정보가 올바르지 않습니다.")
      return
    }

    try {
      const fromNodeInfo = {
        building: edgeModalNode.building,
        floor: edgeModalNode.floor,
        node: getNodeSuffix(edgeModalNode.id),
      }

      const toNodeInfo = parseNodeInfo(targetNodeId)

      if (
        !fromNodeInfo.building ||
        !fromNodeInfo.floor ||
        !fromNodeInfo.node ||
        !toNodeInfo.building ||
        !toNodeInfo.floor ||
        !toNodeInfo.node
      ) {
        showToast("노드 ID 형식이 올바르지 않습니다.")
        return
      }

      const requestBody = {
        from_building: fromNodeInfo.building,
        from_floor: fromNodeInfo.floor,
        from_node: fromNodeInfo.node,
        to_building: toNodeInfo.building,
        to_floor: toNodeInfo.floor,
        to_node: toNodeInfo.node,
      }

      const res = await apiDelete("/api/map-route", requestBody)
      const data = await parseJsonResponse(res)
      if (!res.ok) {
        showToast(data.error || "연결 해제 실패")
        return
      }
      showToast("연결이 해제되었습니다.")
      reloadMapData()
    } catch (err) {
      showToast("서버 오류: " + (err.message || "알 수 없는 오류"))
    }
  }, [edgeModalNode, reloadMapData, getNodeSuffix, parseNodeInfo, showToast])

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
  }, [edgeStep, edgeFromNode, edgeToNode, edgeConnectMode, connectEdge])

  // 최초 건물 목록/강의실 목록
  useEffect(() => {
    fetchBuildings()
    fetchRooms()
  }, [fetchBuildings, fetchRooms])

  // SVG 로드 (도면 요청)
  const loadMapData = useCallback(async (building, floor) => {
    setMapLoading(true)
    // 상태 초기화
    setSvgRaw("")
    setRoomNodes({})
    setEdges([])
    setSvgNodes([])

    try {
      const res = await apiGet(
        `/api/map-route?building=${encodeURIComponent(building)}&floor=${encodeURIComponent(floor)}`
      )
      const data = await parseJsonResponse(res)

      const fileList = Array.isArray(data) ? data : [data]
      const rawSvgUrl = fileList[0]?.File
      const nodesInfo = fileList[0]?.nodes || {}
      let edgesInfo = fileList[0]?.edges

      if (!edgesInfo) {
        edgesInfo = []
        Object.entries(nodesInfo).forEach(([from, arr]) => {
          arr.forEach((edgeObj) => {
            const to = typeof edgeObj === "string" ? edgeObj : edgeObj.node || edgeObj.to
            if (to) edgesInfo.push({ from, to })
          })
        })
      }

      if (rawSvgUrl) {
        const svgUrl = rawSvgUrl + (rawSvgUrl.includes("?") ? "&" : "?") + "ts=" + Date.now()
        const svgRes = await fetch(svgUrl)
        if (!svgRes.ok) throw new Error("SVG 파일을 불러올 수 없습니다.")
        
        const svgXml = await svgRes.text()
        const { svg: processedSvg, viewBox } = processSvg(svgXml)
        const parsedNodes = parseSvgNodes(svgXml, building, floor)

        setSvgRaw(processedSvg)
        setSvgViewBox(viewBox)
        setRoomNodes(nodesInfo)
        setEdges(edgesInfo)
        setSvgNodes(parsedNodes)
      }
    } catch (error) {
      // 에러 발생 시에도 상태는 초기화된 상태로 유지
      setError("맵 데이터를 불러오지 못했습니다.")
    } finally {
      setMapLoading(false)
    }
  }, [processSvg, parseSvgNodes])

  // ✅ 건물/층 필터 변경 시 데이터 로딩 로직 통합
  useEffect(() => {
    // 맵 관련 상태 초기화
    if (!filterBuilding || !filterFloor) {
      setSvgRaw("")
      setRoomNodes({})
      setEdges([])
      setSvgNodes([])
    }

    // 건물 필터가 변경되면 층 목록을 새로 가져옴
    if (filterBuilding) {
      fetchFloors(filterBuilding)
    } else {
      setFloorOptions([])
    }

    // 강의실 목록 가져오기
    fetchRooms(filterBuilding, filterFloor)

    // 맵 데이터 가져오기 (건물과 층이 모두 선택된 경우에만)
    if (filterBuilding && filterFloor) {
      loadMapData(filterBuilding, filterFloor)
    }
  }, [filterBuilding, filterFloor, fetchRooms, fetchFloors, loadMapData])

  // 다른 층 계단 연결
  useEffect(() => {
    if (!stairsBuilding || !stairsFloor || !stairsId) {
      setStairsList([])
      setStairsNodes([])
      return
    }

    setStairsLoading(true)
    setStairsError("")

    apiGet(
      `/api/stairs-route?building=${encodeURIComponent(
        stairsBuilding
      )}&floor=${encodeURIComponent(stairsFloor)}&id=${encodeURIComponent(stairsId)}`
    )
      .then(async (res) => parseJsonResponse(res))
      .then((data) => {
        if (Array.isArray(data)) {
          setStairsList(data)
        } else if (data) {
          setStairsList(Array.isArray(data.stairs) ? data.stairs : [])
          setStairsNodes(Array.isArray(data.nodes) ? data.nodes : [])
        } else {
          setStairsList([])
          setStairsNodes([])
          setStairsError(data.error || "계단 정보를 불러오지 못했습니다.")
        }
      })
      .catch(() => setStairsError("계단 정보를 불러오지 못했습니다."))
      .finally(() => setStairsLoading(false))
  }, [stairsBuilding, stairsFloor, stairsId])

  // 계단 연결
  const connectEdgeToStairs = useCallback(async (fromNode, toNodeInfo) => {
    const { building: toBuilding, floor: toFloor, node: toNode } = toNodeInfo

    const toNodeFullId = `${toBuilding}@${toFloor}@${toNode}`

    if (isEdgeDuplicate(edges, fromNode?.id, toNodeFullId)) {
      showToast("이미 연결된 엣지입니다.")
      return
    }

    try {
      const res = await apiPost("/api/map-route", {
        from_building: fromNode.building,
        from_floor: fromNode.floor,
        from_node: getNodeSuffix(fromNode.id),
        to_building: toBuilding,
        to_floor: toFloor,
        to_node: toNode,
      })

      const data = await parseJsonResponse(res)

      if (!res.ok) {
        showToast(data.error || "계단 연결 실패")
        return
      }

      showToast("계단이 성공적으로 연결되었습니다.")
      reloadMapData() // 연결 후 맵 데이터 새로고침
    } catch (err) {
      showToast("서버 오류: " + (err.message || "알 수 없는 오류"))
    }
  }, [edges, reloadMapData, isEdgeDuplicate, getNodeSuffix, showToast])

  // 모달 핸들러들
  const handleCloseEdgeModal = useCallback(() => {
    setShowEdgeModal(false)
  }, [])

  const handleConnectEdgeClick = useCallback(() => {
    setEdgeFromNode(edgeModalNode)
    setShowEdgeModal(false)
    setEdgeConnectMode(true)
    setEdgeToNode(null)
  }, [edgeModalNode])

  const handleOpenStairsModal = useCallback(() => {
    setStairsBuilding(edgeModalNode.building)
    setStairsFloor(edgeModalNode.floor)
    setStairsId(edgeModalNode.id)
    setSelectedStairsNode(edgeModalNode)
    setShowStairsSelectModal(true)
  }, [edgeModalNode])

  const handleCloseStairsModal = useCallback(() => {
    setShowStairsSelectModal(false)
    setTargetStairId("")
    setSelectedStairsNode(null)
  }, [])

  const handleStairsConnect = useCallback(async () => {
    if (!selectedStairsNode || !targetStairId) return

    const parsedTarget = parseNodeInfo(targetStairId)
    await connectEdgeToStairs(selectedStairsNode, parsedTarget)

    setTargetStairId("")
    setShowStairsSelectModal(false)
    setSelectedStairsNode(null)
  }, [selectedStairsNode, targetStairId, parseNodeInfo, connectEdgeToStairs])

  const handleCloseEdgeConnectModal = useCallback(() => {
    setShowEdgeConnectModal(false)
    setEdgeStep(0)
    setEdgeFromNode(null)
    setEdgeToNode(null)
  }, [])

  const handleCloseEditRoomModal = useCallback(() => {
    setShowEditRoomModal(false)
  }, [])

  const handleSaveRoom = useCallback(async () => {
    try {
      const users = editRoomUsers.map((u) => u.user)
      const phones = editRoomUsers.map((u) => u.phone)
      const emails = editRoomUsers.map((u) => u.email)
      const res = await apiPut(
        `/api/room-route/${encodeURIComponent(
          editRoom.building
        )}/${encodeURIComponent(editRoom.floor)}`,
        {
          room_name: editRoomName,
          room_desc: editRoomDesc,
          room_user: users,
          user_phone: phones,
          user_email: emails,
        }
      )
      if (!res.ok) throw new Error()
      setShowEditRoomModal(false)
      setEditRoomError("")
      fetchRooms(filterBuilding, filterFloor)
    } catch {
      setEditRoomError("수정 중 오류가 발생했습니다.")
    }
  }, [editRoom, editRoomName, editRoomDesc, editRoomUsers, filterBuilding, filterFloor, fetchRooms])

  return (
    <div className={styles["room-root"]}>
      {loading && <LoadingOverlay />}
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
          <input
            type="text"
            placeholder="검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles["search-input"]}
          />
        </div>

        <div className={styles["room-manage-main-row"]}>
          <RoomTable
            pagedRooms={pagedRooms}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            goToPrevPage={goToPrevPage}
            goToNextPage={goToNextPage}
            setEditRoom={setEditRoom}
            setEditRoomName={setEditRoomName}
            setEditRoomDesc={setEditRoomDesc}
            setEditRoomUsers={setEditRoomUsers}
            setEditRoomError={setEditRoomError}
            setShowEditRoomModal={setShowEditRoomModal}
            styles={styles} // CSS 모듈을 props로 전달
          />
          <MapViewer
            mapLoading={mapLoading}
            filterBuilding={filterBuilding}
            filterFloor={filterFloor}
            svgRaw={svgRaw}
            svgViewBox={svgViewBox}
            svgNodes={svgNodes}
            edges={edges}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
            parseNodeInfo={parseNodeInfo}
            styles={styles}
          />
          <EdgeModal
            show={showEdgeModal}
            onClose={handleCloseEdgeModal}
            edgeModalNode={edgeModalNode}
            connectedNodes={connectedNodes}
            onDisconnectEdge={handleDisconnectEdge}
            onConnectEdge={handleConnectEdgeClick}
            onOpenStairsModal={handleOpenStairsModal}
            styles={styles}
          />
          <StairsModal
            show={showStairsSelectModal}
            onClose={handleCloseStairsModal}
            stairsLoading={stairsLoading}
            stairsError={stairsError}
            stairsList={stairsList}
            stairsNodes={stairsNodes}
            selectedStairsNode={selectedStairsNode}
            targetStairId={targetStairId}
            setTargetStairId={setTargetStairId}
            onConnect={handleStairsConnect}
            parseNodeInfo={parseNodeInfo}
            styles={styles}
          />
          <EdgeConnectModal
            show={showEdgeConnectModal}
            onClose={handleCloseEdgeConnectModal}
            filterBuilding={filterBuilding}
            filterFloor={filterFloor}
            edgeFromNode={edgeFromNode}
            styles={styles}
          />
        </div>
      </div>
      <EditRoomModal
        show={showEditRoomModal}
        onClose={handleCloseEditRoomModal}
        editRoom={editRoom}
        editRoomName={editRoomName}
        editRoomDesc={editRoomDesc}
        setEditRoomDesc={setEditRoomDesc}
        editRoomUsers={editRoomUsers}
        setEditRoomUsers={setEditRoomUsers}
        editRoomError={editRoomError}
        onSave={handleSaveRoom}
        styles={styles}
      />
      {/* 토스트 메시지 UI */}
      {toastVisible && (
        <div className={styles.toastPopup}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
