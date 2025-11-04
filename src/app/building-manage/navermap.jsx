// navermap
"use client"
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { apiGet, apiDelete, apiPut, apiPost, parseJsonResponse } from "../utils/apiHelper"
import { useToast } from "../utils/useToast"
import AddNodeModal from "./AddNodeModal"
import ManageNodeModal from "./ManageNodeModal"
import ImageZoomModal from "./ImageZoomModal"
import styles from "./building-manage.module.css"

function NaverMap({ setLatLng, nodes: propNodes, menuOpen }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const markersRef = useRef([])
  const polylineRef = useRef([])

  const [nodes, setNodes] = useState(propNodes || [])
  const [edges, setEdges] = useState([])
  
  // propNodes가 변경되면 내부 nodes 상태 업데이트
  useEffect(() => {
    if (propNodes) {
      setNodes(propNodes)
    }
  }, [propNodes])

  // 팝업 닫기 함수 (다른 함수들보다 먼저 정의)
  const closeAllPopups = useCallback(() => {
    setAddPopup({ open: false, x: null, y: null })
    setDeletePopup({
      open: false,
      id: null,
      node_name: "",
      type: "",
      x: null,
      y: null,
    })
    setEdgeConnectMode({ active: false, fromNode: null })
    setEdgeConnectHint(false)
    setImageZoomModal({ open: false, imageUrl: "", imageIndex: 0, totalImages: 0 })
    // 임시 마커도 제거
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }
  }, [])

  // nodes 데이터
  const fetchNodes = useCallback(async () => {
    try {
      const res = await apiGet("/api/tower-route")
      const json = await parseJsonResponse(res)
      setNodes(json.nodes || [])
    } catch (e) {
      setNodes([])
    }
  }, [])

  // edges 데이터
  const fetchEdges = useCallback(async () => {
    try {
      const res = await apiGet("/api/node-route")
      const json = await parseJsonResponse(res)
      setEdges(json.edges || [])
    } catch (e) {
      setEdges([])
    }
  }, [])

  // 다음 바깥 노드 이름 생성 (다른 함수들보다 먼저 정의)
  const getNextONodeName = useCallback(() => {
    // nodes가 배열이 아닌 객체일 수 있으므로 배열로 변환
    let nodesArray = Array.isArray(nodes)
      ? nodes
      : nodes && typeof nodes === "object"
      ? Object.entries(nodes).map(([id, value]) => ({ id, ...value }))
      : []
    
    const oNumbers = nodesArray
      .map((n) => n.id || n.node_name)
      .filter((id) => typeof id === "string" && id.startsWith("O"))
      .map((id) => parseInt(id.slice(1), 10))
      .filter((num) => !isNaN(num))
    const maxO = oNumbers.length > 0 ? Math.max(...oNumbers) : 0
    return "O" + (maxO + 1)
  }, [nodes])

  const [addPopup, setAddPopup] = useState({
    open: false,
    x: null,
    y: null,
  })
  const [type, setType] = useState("building")
  const [nodeName, setNodeName] = useState("")
  const [desc, setDesc] = useState("")
  const [newBuildingImages, setNewBuildingImages] = useState([])

  const [edgeConnectHint, setEdgeConnectHint] = useState(false)
  const [deletePopup, setDeletePopup] = useState({
    open: false,
    id: null,
    node_name: "",
    type: "",
    x: null,
    y: null,
  })
  const [edgeConnectMode, setEdgeConnectMode] = useState({
    active: false,
    fromNode: null,
  })
  // 토스트 메시지 훅
  const { toastMessage, toastVisible, showToast } = useToast()

  const [recentlyAddedNode, setRecentlyAddedNode] = useState(null)

  const tempMarkerRef = useRef(null)

  // 건물 설명 수정 관련 state
  const [buildingDesc, setBuildingDesc] = useState("")
  const [buildingDescLoading, setBuildingDescLoading] = useState(false)
  const [existingImageUrl, setExistingImageUrl] = useState("")
  const [currentBuilding, setCurrentBuilding] = useState(null)

  // 이미지 확대 보기 모달
  const [imageZoomModal, setImageZoomModal] = useState({
    open: false,
    imageUrl: "",
    imageIndex: 0,
    totalImages: 0
  })

  // 지도 API 스크립트 준비 여부
  const [ready, setReady] = useState(false)

  // 메뉴가 열릴 때 팝업들 닫기
  useEffect(() => {
    if (menuOpen) {
      setAddPopup({ open: false, x: null, y: null })
      setDeletePopup({ open: false, id: null, node_name: "", type: "", x: null, y: null })
      setEdgeConnectMode({ active: false, fromNode: null })
      setEdgeConnectHint(false)
      setImageZoomModal({ open: false, imageUrl: "", imageIndex: 0, totalImages: 0 })
      // 임시 마커 제거
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null)
        tempMarkerRef.current = null
      }
    }
  }, [menuOpen])

  // 추가
  const [buildingImageIndex, setBuildingImageIndex] = useState(0)
  const [currentImageArr, setCurrentImageArr] = useState([])
  const [selectedImages, setSelectedImages] = useState([])

  // 이미지 선택 토글 함수
  const toggleImageSelection = useCallback((imageUrl) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageUrl)) {
        return prev.filter((url) => url !== imageUrl)
      } else {
        return [...prev, imageUrl]
      }
    })
  }, [])

  // 선택된 이미지 삭제 함수
  const handleDeleteSelectedImages = useCallback(async () => {
    if (selectedImages.length === 0) {
      showToast("삭제할 이미지를 선택해주세요.")
      return
    }

    if (!window.confirm("선택한 이미지를 삭제하시겠습니까?")) return

    try {
      const requestBody = {
        image_urls: selectedImages,
      }

      // 선택된 이미지들을 배열로 한 번에 삭제
      const res = await apiDelete(
        `/api/building-route?building=${encodeURIComponent(deletePopup.node_name)}`,
        requestBody
      )

      const data = await res.json()

      if (!data.success) {
        showToast(data.error || "이미지 삭제 실패")
        return
      }

      // 현재 이미지 배열에서 선택된 이미지들 제거
      setCurrentImageArr((prev) =>
        prev.filter((url) => !selectedImages.includes(url))
      )
      setSelectedImages([])
      setBuildingImageIndex(0)
      showToast("선택한 이미지가 삭제되었습니다.")
    } catch (error) {
      showToast("서버 오류")
    }
  }, [selectedImages, deletePopup.node_name, showToast])

  useEffect(() => {
    setBuildingImageIndex(0)
    setCurrentImageArr([])
  }, [deletePopup.node_name])

  useEffect(() => {
    if (!deletePopup.open || !deletePopup.node_name) return

    const fetchBuildingData = async () => {
      try {
        const res = await apiGet("/api/building-route")
        const json = await parseJsonResponse(res)

        if (json.all && Array.isArray(json.all)) {
          const found = json.all.find(
            (b) =>
              b.Building_Name === deletePopup.node_name ||
              b.name === deletePopup.node_name
          )

          if (found) {
            setCurrentBuilding(found)
            setBuildingDesc(found.Description || found.Desc || found.desc || "")

            let newImageArr = []
            if (Array.isArray(found.Image) && found.Image.length > 0) {
              newImageArr = [...found.Image]
            } else if (Array.isArray(found.image) && found.image.length > 0) {
              newImageArr = [...found.image]
            } else if (found.image) {
              newImageArr = [found.image]
            } else if (found.image_url) {
              newImageArr = [found.image_url]
            }

            setCurrentImageArr(newImageArr)
            if (newImageArr.length > 0) {
              setExistingImageUrl(newImageArr[0])
            }
          }
        }
      } catch (error) {
        setCurrentBuilding(null)
        setCurrentImageArr([])
        setBuildingDesc("")
        setExistingImageUrl("")
      }
    }

    fetchBuildingData()
  }, [deletePopup.open, deletePopup.node_name])

  useEffect(() => {
    if (buildingImageIndex >= currentImageArr.length) {
      setBuildingImageIndex(Math.max(0, currentImageArr.length - 1))
    }
  }, [currentImageArr, buildingImageIndex])

  // 네이버 지도 스크립트 로딩
  useEffect(() => {
    if (typeof window === "undefined") return
    const existing = document.querySelector('script[src*="maps.js"]')
    if (existing) {
      if (window.naver && window.naver.maps) setReady(true)
      else existing.addEventListener("load", () => setReady(true))
      return
    }
    const script = document.createElement("script")
    script.src =
      "https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=yxffktqahm"
    script.async = true
    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  // 지도 생성 여부 확인
  useEffect(() => {
    if (!ready) return
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapRef.current
    )
      return
    if (!mapInstance.current) {
      let center = new window.naver.maps.LatLng(36.3377622, 127.4460928)
      let zoom = 17
      try {
        const saved = JSON.parse(localStorage.getItem("naverMapCenter"))
        if (saved && saved.lat && saved.lng) {
          center = new window.naver.maps.LatLng(saved.lat, saved.lng)
        }
        const savedZoom = parseInt(localStorage.getItem("naverMapZoom"), 10)
        if (!isNaN(savedZoom)) zoom = savedZoom
      } catch (e) {}
      const map = new window.naver.maps.Map(mapRef.current, { center, zoom })
      mapInstance.current = map
      localStorage.removeItem("naverMapCenter")
      localStorage.removeItem("naverMapZoom")
      // (이하 지도 클릭/마커 등 이벤트 핸들링)
    }
  }, [ready])

  useEffect(() => {
    if (menuOpen) {
      closeAllPopups()
    }
  }, [menuOpen, closeAllPopups])

  // 최초 nodes, edges
  useEffect(() => {
    fetchNodes()
    fetchEdges()
  }, [fetchNodes, fetchEdges])

  // 건물 관리 팝업이 열릴 때마다 전체 건물 데이터 받아와서 설명과 이미지 추출
  useEffect(() => {
    async function fetchBuildingInfo() {
      if (
        deletePopup.open &&
        deletePopup.type === "building" &&
        deletePopup.node_name
      ) {
        try {
          const res = await apiGet("/api/building-route")
          const json = await parseJsonResponse(res)
          let found = null
          if (json.all && Array.isArray(json.all)) {
            found = json.all.find(
              (b) =>
                b.Building_Name === deletePopup.node_name ||
                b.name === deletePopup.node_name
            )
          }
          if (found) {
            setBuildingDesc(found.Description || found.Desc || found.desc || "")
            setCurrentBuilding(found)
          }
        } catch (error) {
          setBuildingDesc("")
          setCurrentBuilding(null)
        }
      } else {
        setBuildingDesc("")
        setCurrentBuilding(null)
      }
    }
    fetchBuildingInfo()
  }, [deletePopup])

  // 지도 최초 생성 및 클릭 마커 + 추가 팝업
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapRef.current
    )
      return

    if (!mapInstance.current) {
      let center = new window.naver.maps.LatLng(36.3377622, 127.4460928)
      let zoom = 17
      try {
        const saved = JSON.parse(localStorage.getItem("naverMapCenter"))
        if (saved && saved.lat && saved.lng) {
          center = new window.naver.maps.LatLng(saved.lat, saved.lng)
        }
        const savedZoom = parseInt(localStorage.getItem("naverMapZoom"), 10)
        if (!isNaN(savedZoom)) zoom = savedZoom
      } catch (e) {}

      const map = new window.naver.maps.Map(mapRef.current, { center, zoom })
      mapInstance.current = map

      localStorage.removeItem("naverMapCenter")
      localStorage.removeItem("naverMapZoom")

      naver.maps.Event.addListener(map, "click", function (e) {
        setAddPopup({ open: true, x: e.coord.y, y: e.coord.x })
        setDeletePopup({
          open: false,
          id: null,
          node_name: "",
          type: "",
          x: null,
          y: null,
        })
        setNodeName("")
        setDesc("")
        setNewBuildingImages([])

        if (tempMarkerRef.current) {
          tempMarkerRef.current.setMap(null)
          tempMarkerRef.current = null
        }
        tempMarkerRef.current = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(e.coord.y, e.coord.x),
          map,
          zIndex: 9999,
          clickable: false,
        })
      })
    }
  }, [])

  // 엣지 연결 모드 상태에 따른 지도 클릭 이벤트 제어
  useEffect(() => {
    if (!mapInstance.current) return

    const map = mapInstance.current
    
    // 기존 클릭 이벤트 리스너 제거
    naver.maps.Event.clearListeners(map, 'click')
    
    // 새로운 클릭 이벤트 리스너 추가
    naver.maps.Event.addListener(map, "click", function (e) {
      // 엣지 연결 모드일 때는 지도 클릭 이벤트 무시
      if (edgeConnectMode.active) {
        return
      }
      
      setAddPopup({ open: true, x: e.coord.y, y: e.coord.x })
      setDeletePopup({
        open: false,
        id: null,
        node_name: "",
        type: "",
        x: null,
        y: null,
      })
      setNodeName("")
      setDesc("")
      setNewBuildingImages([])

      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null)
        tempMarkerRef.current = null
      }
      tempMarkerRef.current = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(e.coord.y, e.coord.x),
        map,
        zIndex: 9999,
        clickable: false,
      })
    })
  }, [edgeConnectMode.active])

  // 드래그 앤 드롭 기능 비활성화로 인해 마커 드래그 상태 업데이트 로직 제거

  // ESC 키로 엣지 연결 모드 취소 및 이미지 확대 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (edgeConnectMode.active) {
          setEdgeConnectMode({ active: false, fromNode: null })
          setEdgeConnectHint(false)
          // 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null)
            tempMarkerRef.current = null
          }
        } else if (imageZoomModal.open) {
          closeImageZoomModal()
        }
      }
    }

    if (edgeConnectMode.active || imageZoomModal.open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [edgeConnectMode.active, imageZoomModal.open])

  useEffect(() => {
    if (!window.naver || !mapInstance.current) return
    
    // nodes를 배열로 변환
    const nodesArray = Array.isArray(nodes)
      ? nodes
      : nodes && typeof nodes === "object"
      ? Object.entries(nodes).map(([id, value]) => ({ id, ...value }))
      : []
    
    if (!nodesArray || nodesArray.length === 0) return

    const xs = nodesArray.map((n) => n.x).filter((x) => typeof x === "number")
    const ys = nodesArray.map((n) => n.y).filter((y) => typeof y === "number")
    if (xs.length === 0 || ys.length === 0) return
  }, [nodes])

  // 마커/원/이벤트 등록
  useEffect(() => {
    const naver = window.naver
    const map = mapInstance.current
    if (!naver || !map) return

    if (Array.isArray(circlesRef.current)) {
      circlesRef.current.forEach((circle) => {
        if (circle && typeof circle.setMap === "function") {
          try {
            circle.setMap(null)
          } catch (e) {}
        }
      })
    }
    if (Array.isArray(markersRef.current)) {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.setMap === "function") {
          try {
            marker.setMap(null)
          } catch (e) {}
        }
      })
    }
    circlesRef.current = []
    markersRef.current = []

    let nodesArray = Array.isArray(nodes)
      ? nodes
      : nodes && typeof nodes === "object"
      ? Object.entries(nodes).map(([id, value]) => ({ id, ...value }))
      : []

    const nodeEntries = nodesArray.map((n, idx) => [n.id || String(idx), n])

    nodeEntries.forEach(([id, { x, y, node_name }]) => {
      const isNode = id && id.startsWith("O")
      const type = isNode ? "node" : "building"

      const circle = new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(x, y),
        radius: 2,
        fillColor: isNode ? "#ff0000" : "#0066ff",
        fillOpacity: 1,
        strokeColor: isNode ? "#ff0000" : "#0066ff",
        strokeOpacity: 1,
        strokeWeight: 2,
      })
      circlesRef.current.push(circle)

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(x, y),
        map,
        draggable: false, // 드래그 앤 드롭 기능 비활성화
        opacity: 0.3,
        title: node_name || id,
        zIndex: 100,
        clickable: true,
        cursor: "pointer",
      })
      markersRef.current.push(marker)

      naver.maps.Event.addListener(marker, "click", function (e) {
        e.domEvent?.preventDefault?.()
        if (edgeConnectMode.active) {
          handleEdgeConnect(edgeConnectMode.fromNode, {
            id,
            node_name: node_name || id,
          })
          setEdgeConnectMode({ active: false, fromNode: null })
          setEdgeConnectHint(false)
          // 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null)
            tempMarkerRef.current = null
          }
        } else {
          setAddPopup({ open: false, x: null, y: null })
          setDeletePopup({
            open: true,
            id,
            node_name: node_name || id,
            type,
            x,
            y,
          })
          // 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null)
            tempMarkerRef.current = null
          }
        }
      })

      naver.maps.Event.addListener(circle, "click", function (e) {
        e.domEvent?.preventDefault?.()
        if (edgeConnectMode.active) {
          handleEdgeConnect(edgeConnectMode.fromNode, {
            id,
            node_name: node_name || id,
          })
          setEdgeConnectMode({ active: false, fromNode: null })
          setEdgeConnectHint(false)
          // 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null)
            tempMarkerRef.current = null
          }
        } else {
          setAddPopup({ open: false, x: null, y: null })
          setDeletePopup({
            open: true,
            id,
            node_name: node_name || id,
            type,
            x,
            y,
          })
          // 임시 마커 제거
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null)
            tempMarkerRef.current = null
          }
        }
      })

      // 드래그 앤 드롭 기능 비활성화로 인해 dragend 이벤트 리스너 제거
    })

    // 마커/이벤트 등록이 끝난 뒤에 팝업 띄우기 (추가된 노드)
    if (recentlyAddedNode) {
      const found = nodeEntries.find(
        ([, n]) => n.node_name === recentlyAddedNode
      )
      if (found) {
        const [id, n] = found
        setDeletePopup({
          open: true,
          id,
          node_name: n.node_name || id,
          x: n.x,
          y: n.y,
        })
        setRecentlyAddedNode(null)
      }
    }
  }, [nodes, edges, edgeConnectMode, recentlyAddedNode])

  // Polyline(노드 선) 표시 (edges + nodes 매핑)
  useEffect(() => {
    const naver = window.naver
    const map = mapInstance.current
    if (!naver || !map) return

    let nodesArray = Array.isArray(nodes)
      ? nodes
      : nodes && typeof nodes === "object"
      ? Object.entries(nodes).map(([id, value]) => ({ id, ...value }))
      : []

    const nodeCoordMap = {}
    nodesArray.forEach((n) => {
      nodeCoordMap[n.id] = { x: n.x, y: n.y }
    })

    if (polylineRef.current && Array.isArray(polylineRef.current)) {
      polylineRef.current.forEach((line) => line.setMap(null))
    }
    polylineRef.current = []

    const drawnSet = new Set()
    edges.forEach((edge) => {
      const fromCoord = nodeCoordMap[edge.id]
      if (!fromCoord) return
      ;(edge.nodes || []).forEach((n) => {
        const toCoord = nodeCoordMap[n.node]
        if (!toCoord) return
        const key = [edge.id, n.node].sort().join("-")
        if (drawnSet.has(key)) return
        drawnSet.add(key)
        const path = [
          new naver.maps.LatLng(fromCoord.x, fromCoord.y),
          new naver.maps.LatLng(toCoord.x, toCoord.y),
        ]
        const polyline = new naver.maps.Polyline({
          map,
          path,
          strokeColor: "#00C3FF",
          strokeWeight: 4,
          strokeOpacity: 0.8,
          strokeStyle: "solid",
        })
        polylineRef.current.push(polyline)
      })
    })
  }, [edges, nodes])

  // 건물 설명 수정
  const handleUpdateBuildingDesc = useCallback(async (e) => {
    e.preventDefault()
    if (!deletePopup.node_name) {
      showToast("건물 이름이 없습니다.")
      return
    }
    setBuildingDescLoading(true)
    try {
      const formData = new FormData()
      
      // 설명 필드는 항상 추가 (빈 문자열이어도)
      formData.append("desc", buildingDesc || "")

      // 새로 추가된 이미지가 있는 경우에만 이미지 추가 (건물 추가와 동일한 방식)
      if (newBuildingImages.length > 0) {
        newBuildingImages.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }

      const res = await apiPut(
        `/api/building-route?building=${encodeURIComponent(
          deletePopup.node_name
        )}`,
        formData
      )

      const data = await res.json()

      if (data && !data.error) {
        showToast("정보 수정 완료!")
        // 최신 정보 다시 불러오기
        const res2 = await apiGet("/api/building-route")
        const json2 = await parseJsonResponse(res2)
        if (json2.all && Array.isArray(json2.all)) {
          const found = json2.all.find(
            (b) =>
              b.Building_Name === deletePopup.node_name ||
              b.name === deletePopup.node_name
          )
          if (found) {
            setBuildingDesc(found.Description || found.Desc || found.desc || "")

            // 이미지 배열 업데이트
            let newImageArr = []
            if (Array.isArray(found.Image) && found.Image.length > 0) {
              newImageArr = [...found.Image]
            } else if (Array.isArray(found.image) && found.image.length > 0) {
              newImageArr = [...found.image]
            } else if (found.image) {
              newImageArr = [found.image]
            } else if (found.image_url) {
              newImageArr = [found.image_url]
            }
            setCurrentImageArr(newImageArr)
            if (newImageArr.length > 0) {
              setExistingImageUrl(newImageArr[0])
            }
          }
        }
        // 이미지 선택 초기화
        setNewBuildingImages([])
        setBuildingImageIndex(0)
      } else {
        showToast(data.error || "정보 수정 실패")
      }
    } catch (error) {
      showToast("서버 오류")
    }
    setBuildingDescLoading(false)
  }, [deletePopup.node_name, buildingDesc, newBuildingImages, showToast])

  // 이미지 파일 선택 핸들러
  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files)
    setNewBuildingImages((prev) => {
      const newImages = [...prev, ...files]
      return newImages
    })
    e.target.value = ""
  }, [])

  // 건물/노드 추가 저장
  const handleAddNode = useCallback(async (e) => {
    e.preventDefault()
    if (addPopup.x == null || addPopup.y == null) {
      showToast("위치를 선택하세요.")
      return
    }

    const map = mapInstance.current
    if (map) {
      const center = map.getCenter()
      const zoom = map.getZoom()
      localStorage.setItem(
        "naverMapCenter",
        JSON.stringify({ lat: center.y, lng: center.x })
      )
      localStorage.setItem("naverMapZoom", zoom)
    }

    let finalNodeName = nodeName
    if (type === "node") {
      finalNodeName = getNextONodeName()
    }

    let res
    if (type === "building") {
      const formData = new FormData()
      formData.append("type", type)
      formData.append("node_name", finalNodeName)
      formData.append("x", addPopup.x.toString())
      formData.append("y", addPopup.y.toString())
      formData.append("desc", desc)
      if (newBuildingImages.length > 0) {
        newBuildingImages.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }

      res = await apiPost("/api/tower-route", formData)
    } else {
      const body = {
        type,
        node_name: finalNodeName,
        x: addPopup.x,
        y: addPopup.y,
      }

      res = await apiPost("/api/tower-route", body)
    }
    
    let data
    try {
      data = await res.json()
    } catch (jsonError) {
      const responseText = await res.text()
      showToast(`서버 응답 오류: ${jsonError.message}`)
      return
    }
    
    if (data.success && !data.error) {
      setAddPopup({ open: false, x: null, y: null })
      await fetchNodes()
      await fetchEdges()
      setRecentlyAddedNode(finalNodeName)
      showToast("추가 성공!")
    } else {
      showToast(data.error || "추가 실패")
    }
  }, [addPopup, type, nodeName, desc, newBuildingImages, mapInstance, fetchNodes, fetchEdges, showToast, getNextONodeName])

  // 건물/노드 삭제 처리 함수
  const handleDeleteNode = useCallback(async () => {
    if (!deletePopup.type || !deletePopup.node_name) return
    if (!window.confirm("정말 삭제하시겠습니까?")) return

    const map = mapInstance.current
    if (map) {
      const center = map.getCenter()
      const zoom = map.getZoom()
      localStorage.setItem(
        "naverMapCenter",
        JSON.stringify({ lat: center.y, lng: center.x })
      )
      localStorage.setItem("naverMapZoom", zoom)
    }

    const res = await apiDelete("/api/tower-route", {
      type: deletePopup.type,
      node_name: deletePopup.node_name,
    })
    const data = await res.json()
    if (data.success) {
      setDeletePopup({
        open: false,
        id: null,
        node_name: "",
        x: null,
        y: null,
      })
      fetchNodes()
      fetchEdges()
      showToast("삭제 성공!")
    } else {
      showToast(data.error || "삭제 실패")
    }
  }, [deletePopup, mapInstance, fetchNodes, fetchEdges, showToast])

  // 외부 노드 엣지 연결 함수
  const handleEdgeConnect = useCallback(async (from, to) => {
    if (!from?.node_name || !to?.node_name) {
      showToast("노드 정보가 올바르지 않습니다.")
      return
    }
    if (from.node_name === to.node_name) {
      showToast("같은 노드는 연결할 수 없습니다.")
      return
    }
    const alreadyConnected = edges.some(
      (edge) =>
        (edge.id === from.node_name &&
          edge.nodes.some((n) => n.node === to.node_name)) ||
        (edge.id === to.node_name &&
          edge.nodes.some((n) => n.node === from.node_name))
    )
    if (alreadyConnected) {
      showToast("이미 연결된 노드입니다.")
      return
    }
    const res = await apiPost("/api/node-route", {
      from_node: from.node_name,
      to_node: to.node_name,
    })
    const data = await res.json()
    if (data.success) {
      showToast("엣지 연결 성공!")
      fetchEdges()
    } else {
      showToast(data.error || "엣지 연결 실패")
    }
  }, [edges, fetchEdges, showToast])

  // 외부 노드 엣지 연결 해제 함수
  const handleEdgeDisconnect = useCallback(async (from_node, to_node) => {
    if (!from_node || !to_node) {
      showToast("노드 정보가 올바르지 않습니다.")
      return
    }
    if (!window.confirm("정말 연결을 해제하시겠습니까?")) return

    const res = await apiDelete("/api/node-route", {
      from_node,
      to_node,
    })
    const data = await res.json()
    if (data.success) {
      showToast("엣지 연결 해제 성공!")
      fetchEdges()
    } else {
      showToast(data.error || "엣지 연결 해제 실패")
    }
  }, [fetchEdges, showToast])

  // 관리 팝업 닫기
  const handleCloseDeletePopup = useCallback(() => {
    setDeletePopup({
      open: false,
      id: null,
      node_name: "",
      type: "",
      x: null,
      y: null,
    })
    setNewBuildingImages([])
  }, [])

  // 추가 팝업 닫기
  const handleClosePopup = useCallback(() => {
    setAddPopup({ open: false, x: null, y: null })
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }
  }, [])

  // 외부 노드 엣지 연결 시작
  const handleStartEdgeConnect = useCallback((node) => {
    setEdgeConnectMode({
      active: true,
      fromNode: { id: node.id, node_name: node.node_name },
    })
    setDeletePopup({
      open: false,
      id: null,
      node_name: "",
      type: "",
      x: null,
      y: null,
    })
    setAddPopup({ open: false, x: null, y: null })
    // 임시 마커 제거
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }
    setEdgeConnectHint(true)
  }, [])

  // 연결된 노드 조회
  const getConnectedNodes = useCallback((nodeId) => {
    const connected = []
    edges.forEach((edge) => {
      if (edge.id === nodeId) {
        ;(edge.nodes || []).forEach((n) => connected.push(n.node))
      }
      ;(edge.nodes || []).forEach((n) => {
        if (n.node === nodeId) connected.push(edge.id)
      })
    })
    return Array.from(new Set(connected))
  }, [edges])

  // 이미지 확대 모달 열기
  const openImageZoomModal = useCallback((imageUrl, imageIndex, totalImages) => {
    setImageZoomModal({
      open: true,
      imageUrl,
      imageIndex,
      totalImages
    })
  }, [])

  // 이미지 확대 모달 닫기
  const closeImageZoomModal = useCallback(() => {
    setImageZoomModal({
      open: false,
      imageUrl: "",
      imageIndex: 0,
      totalImages: 0
    })
  }, [])

  // 이미지 확대 모달에서 이전/다음 이미지
  const navigateImage = useCallback((direction) => {
    const { imageIndex, totalImages } = imageZoomModal
    let newIndex = imageIndex
    
    if (direction === 'prev') {
      newIndex = imageIndex > 0 ? imageIndex - 1 : totalImages - 1
    } else if (direction === 'next') {
      newIndex = imageIndex < totalImages - 1 ? imageIndex + 1 : 0
    }
    
    setImageZoomModal(prev => ({
      ...prev,
      imageIndex: newIndex
    }))
  }, [imageZoomModal])

  // 연결된 노드 목록 메모이제이션
  const connectedNodesList = useMemo(() => {
    if (!deletePopup.node_name) return []
    return getConnectedNodes(deletePopup.node_name)
  }, [deletePopup.node_name, getConnectedNodes])

  // 다음 O 노드명 메모이제이션
  const nextONodeName = useMemo(() => {
    return getNextONodeName()
  }, [getNextONodeName])

  // 이미지 처리 함수들
  const handleFileSelect = useCallback((e) => {
    const newFiles = Array.from(e.target.files)
    setNewBuildingImages((prev) => [...prev, ...newFiles])
    e.target.value = ""
  }, [])

  const handleRemoveFile = useCallback((index) => {
    setNewBuildingImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearAllFiles = useCallback(() => {
    setNewBuildingImages([])
  }, [])

  const handleImageDoubleClick = useCallback((imageUrl, idx, total) => {
    openImageZoomModal(imageUrl, idx, total)
  }, [openImageZoomModal])

  return (
    <div className={styles.navermapContainer}>
      {/* 토스트 메시지 UI */}
      {toastVisible && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
      <div
        className={`naver-map ${styles.mapContainer}`}
        ref={mapRef}
      />

      {/* 왼쪽 고정 통합 모달 팝업 */}
      {(addPopup.open || deletePopup.open) && (
        <div className={styles.modalWrapper}>
          <div className={styles.modalContainer}>
            {/* 탭 */}
            <div className={styles.tabContainer}>
              <button
                className={`${styles.tabButton} ${addPopup.open ? styles.tabButtonActive : ""}`}
                onClick={() => {
                  setAddPopup({ ...addPopup, open: true })
                  setDeletePopup({ ...deletePopup, open: false })
                }}
              >
                노드/건물 추가
              </button>
              <button
                className={`${styles.tabButton} ${deletePopup.open ? styles.tabButtonActive : ""}`}
                onClick={() => {
                  setAddPopup({ ...addPopup, open: false })
                  setDeletePopup({ ...deletePopup, open: true })
                }}
              >
                노드/건물 관리
              </button>
            </div>

            {/* 추가 팝업 (지도 클릭 시에만 뜸) */}
            <AddNodeModal
              addPopup={addPopup}
              type={type}
              nodeName={nodeName}
              desc={desc}
              newBuildingImages={newBuildingImages}
              nextONodeName={nextONodeName}
              onTypeChange={setType}
              onNodeNameChange={setNodeName}
              onDescChange={setDesc}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              onClearAllFiles={handleClearAllFiles}
              onSubmit={handleAddNode}
              onClose={handleClosePopup}
            />

            {/* 관리/삭제 팝업 (마커/원 클릭 시에만 뜸) */}
            <ManageNodeModal
              deletePopup={deletePopup}
              buildingDesc={buildingDesc}
              buildingDescLoading={buildingDescLoading}
              currentImageArr={currentImageArr}
              selectedImages={selectedImages}
              newBuildingImages={newBuildingImages}
              connectedNodes={connectedNodesList}
              onBuildingDescChange={setBuildingDesc}
              onToggleImageSelection={toggleImageSelection}
              onImageDoubleClick={handleImageDoubleClick}
              onDeleteSelectedImages={handleDeleteSelectedImages}
              onAddImage={handleImageSelect}
              onRemoveNewImage={handleRemoveFile}
              onClearAllNewImages={handleClearAllFiles}
              onUpdateBuildingDesc={handleUpdateBuildingDesc}
              onEdgeDisconnect={handleEdgeDisconnect}
              onStartEdgeConnect={handleStartEdgeConnect}
              onDeleteNode={handleDeleteNode}
              onClose={handleCloseDeletePopup}
            />
          </div>
        </div>
      )}

      {/* 엣지 연결 안내 */}
      {edgeConnectHint && (
        <div className={styles.edgeConnectHint}>
          연결할 두 번째 노드를 클릭하세요! (ESC로 취소)
        </div>
      )}

      {/* 이미지 확대 모달 */}
      <ImageZoomModal
        imageModal={imageZoomModal}
        currentImageArr={currentImageArr}
        onClose={closeImageZoomModal}
        onNavigate={navigateImage}
      />
    </div>
  )
}

export default NaverMap
