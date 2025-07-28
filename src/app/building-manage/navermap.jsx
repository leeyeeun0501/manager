// navermap
"use client"
import React, { useEffect, useRef, useState } from "react"

function NaverMap({ isLoggedIn, menuOpen }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const markersRef = useRef([])
  const polylineRef = useRef([])

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

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
  const [recentlyAddedNode, setRecentlyAddedNode] = useState(null)

  const tempMarkerRef = useRef(null)

  // 건물 설명 수정 관련 state
  const [buildingDesc, setBuildingDesc] = useState("")
  const [buildingDescLoading, setBuildingDescLoading] = useState(false)
  const [existingImageUrl, setExistingImageUrl] = useState("")

  // 지도 API 스크립트 준비 여부
  const [ready, setReady] = useState(false)

  // 네이버 지도 스크립트 중복 삽입 없이 1회만 로딩
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
  }, [ready, isLoggedIn])

  useEffect(() => {
    if (menuOpen) {
      closeAllPopups()
    }
  }, [menuOpen])

  // 최초 nodes, edges
  useEffect(() => {
    fetchNodes()
    fetchEdges()
  }, [])

  // 건물 관리 팝업이 열릴 때마다 전체 건물 데이터 받아와서 설명과 이미지 추출
  useEffect(() => {
    async function fetchBuildingInfo() {
      if (
        deletePopup.open &&
        deletePopup.type === "building" &&
        deletePopup.node_name
      ) {
        try {
          const res = await fetch("/api/building-route")
          const json = await res.json()
          let found = null
          if (json.all && Array.isArray(json.all)) {
            found = json.all.find(
              (b) =>
                b.Building_Name === deletePopup.node_name ||
                b.name === deletePopup.node_name
            )
          }
          setBuildingDesc(
            (found &&
              (found.Desc ||
                found.Description ||
                found.desc ||
                found.description ||
                "")) ||
              ""
          )
          // 기존 이미지 URL 설정
          setExistingImageUrl(
            (found && (found.image_url || found.image || "")) || ""
          )
        } catch {
          setBuildingDesc("")
          setExistingImageUrl("")
        }
      } else {
        setBuildingDesc("")
        setExistingImageUrl("")
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
  }, [isLoggedIn])

  useEffect(() => {
    if (!window.naver || !mapInstance.current) return
    if (!nodes || nodes.length === 0) return

    const xs = nodes.map((n) => n.x).filter((x) => typeof x === "number")
    const ys = nodes.map((n) => n.y).filter((y) => typeof y === "number")
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
        draggable: !edgeConnectMode.active,
        opacity: 0.3,
        title: node_name || id,
        zIndex: 100,
        clickable: true,
        cursor: "pointer",
      })
      markersRef.current.push(marker)

      naver.maps.Event.addListener(marker, "click", function () {
        if (edgeConnectMode.active) {
          handleEdgeConnect(edgeConnectMode.fromNode, {
            id,
            node_name: node_name || id,
          })
          setEdgeConnectMode({ active: false, fromNode: null })
          setEdgeConnectHint(false)
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
        }
      })

      naver.maps.Event.addListener(circle, "click", function () {
        if (edgeConnectMode.active) {
          handleEdgeConnect(edgeConnectMode.fromNode, {
            id,
            node_name: node_name || id,
          })
          setEdgeConnectMode({ active: false, fromNode: null })
          setEdgeConnectHint(false)
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
        }
      })

      naver.maps.Event.addListener(marker, "dragend", async function (e) {
        const newLat = e.coord.y
        const newLng = e.coord.x
        circle.setCenter(new naver.maps.LatLng(newLat, newLng))
        try {
          await fetch("/api/tower-route", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              node_name: node_name || id,
              x: newLat,
              y: newLng,
            }),
          })
          setNodes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, x: newLat, y: newLng } : n))
          )
          fetchEdges()
        } catch (err) {
          alert("서버에 좌표를 저장하는 데 실패했습니다.")
        }
      })
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

  // 건물 설명 수정 버튼 클릭 시 서버로 PUT
  async function handleUpdateBuildingDesc(e) {
    e.preventDefault()
    if (!deletePopup.node_name) {
      alert("건물 이름이 없습니다.")
      return
    }
    setBuildingDescLoading(true)
    try {
      const formData = new FormData()
      formData.append("desc", buildingDesc)
      if (newBuildingImages.length > 0) {
        newBuildingImages.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }
      const res = await fetch(
        `/api/building-route?building=${encodeURIComponent(
          deletePopup.node_name
        )}`,
        { method: "PUT", body: formData }
      )
      const data = await res.json()
      if (data && !data.error) {
        alert("정보 수정 완료!")
        // 최신 정보 다시 반영
        const res2 = await fetch(
          `/api/building-route?building=${encodeURIComponent(
            deletePopup.node_name
          )}`
        )
        const json2 = await res2.json()
        if (json2.all && json2.all.length > 0) {
          setBuildingDesc(json2.all[0].Desc || "")
          setExistingImageUrl(
            json2.all[0].image_url || json2.all[0].image || ""
          )
        }
        setNewBuildingImages([])
      } else {
        alert(data.error || "정보 수정 실패")
      }
    } catch {
      alert("서버 오류")
    }
    setBuildingDescLoading(false)
  }

  // nodes 데이터 fetch
  async function fetchNodes() {
    try {
      const res = await fetch("/api/tower-route")
      const json = await res.json()
      setNodes(json.nodes || [])
    } catch (e) {
      setNodes([])
    }
  }

  // edges 데이터 fetch
  async function fetchEdges() {
    try {
      const res = await fetch("/api/node-route")
      const json = await res.json()
      setEdges(json.edges || [])
    } catch (e) {
      setEdges([])
    }
  }

  // 건물/노드 추가 팝업 저장 처리
  async function handleAddNode(e) {
    e.preventDefault()
    if (addPopup.x == null || addPopup.y == null) {
      alert("위치를 선택하세요.")
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
      // 건물인 경우 FormData 사용하여 이미지와 함께 전송
      const formData = new FormData()
      formData.append("type", type)
      formData.append("node_name", finalNodeName)
      formData.append("x", addPopup.x)
      formData.append("y", addPopup.y)
      formData.append("desc", desc)
      if (newBuildingImages.length > 0) {
        newBuildingImages.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }

      console.log(
        "Sending FormData - type:",
        type,
        "node_name:",
        finalNodeName,
        "x:",
        addPopup.x,
        "y:",
        addPopup.y,
        "desc:",
        desc,
        "images count:",
        newBuildingImages.length
      )

      // 이미지 상세 정보 로그
      newBuildingImages.forEach((image, index) => {
        console.log(`Image ${index}:`, {
          name: image.name,
          type: image.type,
          size: image.size,
          lastModified: image.lastModified,
        })
      })

      res = await fetch("/api/tower-route", {
        method: "POST",
        body: formData,
      })
    } else {
      // 노드인 경우 기존 방식 사용
      const body = {
        type,
        node_name: finalNodeName,
        x: addPopup.x,
        y: addPopup.y,
      }

      console.log("Sending JSON - body:", body)

      res = await fetch("/api/tower-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    }

    const data = await res.json()
    if (data.success) {
      setAddPopup({ open: false, x: null, y: null })
      await fetchNodes()
      await fetchEdges()
      setRecentlyAddedNode(finalNodeName)
      alert("추가 성공!")
    } else {
      alert(data.error || "추가 실패")
    }
  }

  // 삭제 처리 함수
  async function handleDeleteNode() {
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

    const res = await fetch("/api/tower-route", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: deletePopup.type,
        node_name: deletePopup.node_name,
      }),
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
      alert("삭제 성공!")
    } else {
      alert(data.error || "삭제 실패")
    }
  }

  // 엣지 연결 함수
  async function handleEdgeConnect(from, to) {
    if (!from?.node_name || !to?.node_name) {
      alert("노드 정보가 올바르지 않습니다.")
      return
    }
    if (from.node_name === to.node_name) {
      alert("같은 노드는 연결할 수 없습니다.")
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
      alert("이미 연결된 노드입니다.")
      return
    }
    const res = await fetch("/api/node-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_node: from.node_name,
        to_node: to.node_name,
      }),
    })
    const data = await res.json()
    if (data.success) {
      alert("엣지 연결 성공!")
      fetchEdges()
    } else {
      alert(data.error || "엣지 연결 실패")
    }
  }

  // 엣지 연결 해제 함수
  async function handleEdgeDisconnect(from_node, to_node) {
    if (!from_node || !to_node) {
      alert("노드 정보가 올바르지 않습니다.")
      return
    }
    if (!window.confirm("정말 연결을 해제하시겠습니까?")) return

    const res = await fetch("/api/node-route", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_node,
        to_node,
      }),
    })
    const data = await res.json()
    if (data.success) {
      alert("엣지 연결 해제 성공!")
      fetchEdges()
    } else {
      alert(data.error || "엣지 연결 해제 실패")
    }
  }

  // 건물 설명 수정 버튼 클릭 시 서버로 PUT
  async function handleUpdateBuildingDesc(e) {
    e.preventDefault()
    if (!deletePopup.node_name) {
      alert("건물 이름이 없습니다.")
      return
    }
    setBuildingDescLoading(true)
    try {
      const formData = new FormData()
      formData.append("desc", buildingDesc)
      const res = await fetch(
        `/api/building-route?building=${encodeURIComponent(
          deletePopup.node_name
        )}`,
        { method: "PUT", body: formData }
      )
      const data = await res.json()
      if (data && !data.error) {
        alert("설명 수정 완료!")
      } else {
        alert(data.error || "설명 수정 실패")
      }
    } catch {
      alert("서버 오류")
    }
    setBuildingDescLoading(false)
  }

  // 다음 O 노드 이름 생성
  function getNextONodeName() {
    const oNumbers = nodes
      .map((n) => n.id || n.node_name)
      .filter((id) => typeof id === "string" && id.startsWith("O"))
      .map((id) => parseInt(id.slice(1), 10))
      .filter((num) => !isNaN(num))
    const maxO = oNumbers.length > 0 ? Math.max(...oNumbers) : 0
    return "O" + (maxO + 1)
  }

  // 관리 팝업 닫기
  function handleCloseDeletePopup() {
    setDeletePopup({
      open: false,
      id: null,
      node_name: "",
      type: "",
      x: null,
      y: null,
    })
    setNewBuildingImages([])
  }

  // 추가 팝업 닫기
  function handleClosePopup() {
    setAddPopup({ open: false, x: null, y: null })
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }
  }

  // 엣지 연결 시작
  function handleStartEdgeConnect(node) {
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
    setEdgeConnectHint(true)
  }

  // 연결된 노드 조회
  function getConnectedNodes(nodeId) {
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
  }

  // 팝업 닫기 함수
  function closeAllPopups() {
    setAddPopup({ open: false, x: null, y: null })
    setDeletePopup({
      open: false,
      id: null,
      node_name: "",
      type: "",
      x: null,
      y: null,
    })
    // 임시 마커도 제거
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        className="naver-map"
        ref={mapRef}
        style={{
          width: "100vw",
          height: "100vh",
          borderRadius: 0,
          boxShadow: "none",
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 1,
          background: "#f5f6fa",
        }}
      />

      {/* 왼쪽 고정 통합 모달 팝업 */}
      {(addPopup.open || deletePopup.open) && (
        <div
          style={{
            position: "fixed",
            top: 80,
            left: 32,
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "36px 32px 28px 32px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
              minWidth: 340,
              maxWidth: "95vw",
              width: 360,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {/* 탭 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 24,
                gap: 8,
              }}
            >
              <button
                className={`modal-tab-btn${addPopup.open ? " active" : ""}`}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 17,
                  fontWeight: 600,
                  color: addPopup.open ? "#0070f3" : "#888",
                  padding: "8px 16px",
                  borderBottom: addPopup.open
                    ? "2.5px solid #0070f3"
                    : "2.5px solid transparent",
                  cursor: "pointer",
                  transition: "color 0.2s, border-bottom 0.2s",
                }}
                onClick={() => {
                  setAddPopup({ ...addPopup, open: true })
                  setDeletePopup({ ...deletePopup, open: false })
                }}
              >
                노드/건물 추가
              </button>
              <button
                className={`modal-tab-btn${deletePopup.open ? " active" : ""}`}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 17,
                  fontWeight: 600,
                  color: deletePopup.open ? "#0070f3" : "#888",
                  padding: "8px 16px",
                  borderBottom: deletePopup.open
                    ? "2.5px solid #0070f3"
                    : "2.5px solid transparent",
                  cursor: "pointer",
                  transition: "color 0.2s, border-bottom 0.2s",
                }}
                onClick={() => {
                  setAddPopup({ ...addPopup, open: false })
                  setDeletePopup({ ...deletePopup, open: true })
                }}
              >
                노드/건물 관리
              </button>
            </div>

            {/* 추가 팝업 (지도 클릭 시에만 뜸) */}
            {addPopup.open && (
              <div
                style={{
                  position: "fixed",
                  top: 80,
                  left: 32,
                  zIndex: 3000,
                  background: "#fff",
                  borderRadius: 24,
                  padding: "36px 32px 28px 32px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                  minWidth: 340,
                  maxWidth: "95vw",
                  width: 360,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  maxHeight: "80vh",
                  overflowY: "auto",
                }}
              >
                {/* 상단 타이틀 */}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#1976d2",
                    marginBottom: 18,
                    textAlign: "center",
                    borderBottom: "2px solid #1976d2",
                    paddingBottom: 6,
                    letterSpacing: "-0.5px",
                  }}
                >
                  노드/건물 추가
                </div>
                {/* 추가 폼 */}
                <form
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    alignItems: "center",
                    width: "100%",
                  }}
                  onSubmit={handleAddNode}
                >
                  {/* 라디오 박스: 왼쪽 정렬 */}
                  <div
                    style={{
                      display: "flex",
                      gap: 18,
                      marginBottom: 8,
                      width: "100%",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      textAlign: "left",
                    }}
                  >
                    <label>
                      <input
                        type="radio"
                        name="type"
                        value="building"
                        checked={type === "building"}
                        onChange={() => setType("building")}
                      />{" "}
                      건물
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="type"
                        value="node"
                        checked={type === "node"}
                        onChange={() => setType("node")}
                      />{" "}
                      노드
                    </label>
                  </div>

                  {/* 위도/경도: 입력란 위, 왼쪽 정렬 */}
                  <div
                    style={{
                      fontSize: 15,
                      color: "#555",
                      width: "100%",
                      textAlign: "left",
                      marginBottom: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      position: "relative",
                    }}
                  >
                    <span>
                      <strong>위도(x):</strong> {addPopup.x} &nbsp;&nbsp;
                      <strong>경도(y):</strong> {addPopup.y}
                    </span>
                    {/* 물음표 툴팁 */}
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: 6,
                        cursor: "pointer",
                        position: "relative",
                      }}
                      tabIndex={0}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          color: "#222",
                          fontWeight: 700,
                          textAlign: "center",
                          lineHeight: "18px",
                          fontSize: 14,
                          border: "1px solid #bbb",
                          userSelect: "none",
                        }}
                      >
                        ?
                      </span>
                      {/* 툴팁 */}
                      <span
                        style={{
                          visibility: "hidden",
                          opacity: 0,
                          position: "fixed",
                          left: "calc(32px + 360px + 24px)",
                          top: "190px",
                          background: "#fff",
                          color: "#222",
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          zIndex: 9999,
                          transition: "opacity 0.15s",
                          pointerEvents: "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                        }}
                        className="latlng-tooltip"
                      >
                        위도(x)는 남북 위치(가로줄), 경도(y)는 동서
                        위치(세로줄)를 의미합니다.
                        <br />
                        지도에서 클릭한 지점의 좌표가 자동으로 입력됩니다.
                      </span>
                      <style>{`
      .latlng-tooltip {
        pointer-events: none;
      }
      span[tabindex]:hover .latlng-tooltip,
      span[tabindex]:focus .latlng-tooltip {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `}</style>
                    </span>
                  </div>

                  {/* 건물/노드 입력란 */}
                  {type === "building" && (
                    <>
                      <input
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          borderRadius: "25px",
                          border: "1px solid #e0e0e0",
                          fontSize: 16,
                          marginBottom: 0,
                          background: "#fff",
                          color: "#333",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          boxSizing: "border-box",
                        }}
                        type="text"
                        value={nodeName}
                        onChange={(e) => setNodeName(e.target.value)}
                        placeholder="이름"
                        required
                      />
                      <textarea
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          borderRadius: "25px",
                          border: "1px solid #e0e0e0",
                          fontSize: 16,
                          marginBottom: 0,
                          fontFamily: "inherit",
                          resize: "none",
                          background: "#fff",
                          color: "#333",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          boxSizing: "border-box",
                          minHeight: "120px",
                        }}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="설명"
                        rows={3}
                      />
                      {/* 이미지 업로드 필드 */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("add-file-input").click()
                            }
                            style={{
                              background: "#1976d2",
                              color: "white",
                              border: "none",
                              padding: "12px 20px",
                              borderRadius: "8px",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: 8,
                            }}
                          >
                            <span style={{ fontSize: 16 }}>+</span> 파일 추가
                          </button>
                        </div>

                        <input
                          id="add-file-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files)
                            setNewBuildingImages((prev) => [
                              ...prev,
                              ...newFiles,
                            ])
                            e.target.value = "" // 입력 필드 초기화
                          }}
                          style={{ display: "none" }}
                        />

                        {newBuildingImages.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#333",
                                marginBottom: 8,
                              }}
                            >
                              선택된 파일 ({newBuildingImages.length}개):
                            </div>
                            <div
                              style={{
                                maxHeight: 120,
                                overflowY: "auto",
                                border: "1px solid #e0e0e0",
                                borderRadius: "8px",
                                padding: "8px",
                              }}
                            >
                              {newBuildingImages.map((file, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    marginBottom: "4px",
                                    background: "#f8f9fa",
                                    borderRadius: "4px",
                                    fontSize: 13,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#333",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      flex: 1,
                                      marginRight: 8,
                                    }}
                                  >
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewBuildingImages((prev) =>
                                        prev.filter((_, i) => i !== index)
                                      )
                                    }}
                                    style={{
                                      background: "#dc3545",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      padding: "2px 6px",
                                      fontSize: 12,
                                      cursor: "pointer",
                                      minWidth: "20px",
                                      height: "20px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    title="삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewBuildingImages([])}
                              style={{
                                background: "#6c757d",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                fontSize: 12,
                                cursor: "pointer",
                                marginTop: 8,
                              }}
                            >
                              모든 파일 제거
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {type === "node" && (
                    <div
                      style={{
                        fontSize: 15,
                        color: "#555",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      <strong>자동 생성 노드명:</strong> {getNextONodeName()}
                    </div>
                  )}

                  {/* 버튼 영역 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 10,
                      width: "100%",
                    }}
                  >
                    <button
                      type="button"
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
                      onClick={handleClosePopup}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
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
                      저장
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 관리/삭제 팝업 (마커/원 클릭 시에만 뜸) */}
            {deletePopup.open && (
              <div
                style={{
                  position: "fixed",
                  top: 80,
                  left: 32,
                  zIndex: 3000,
                  background: "#fff",
                  borderRadius: 24,
                  padding: "36px 32px 28px 32px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                  minWidth: 340,
                  maxWidth: "95vw",
                  width: 360,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {/* 상단 타이틀 */}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#1976d2",
                    marginBottom: 18,
                    textAlign: "center",
                    borderBottom: "2px solid #1976d2",
                    paddingBottom: 6,
                    letterSpacing: "-0.5px",
                  }}
                >
                  노드/건물 관리
                </div>
                {/* 삭제/엣지 관리 */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <div style={{ fontSize: 15, color: "#555" }}>
                    <strong>이름:</strong> {deletePopup.node_name} <br />
                    <span>
                      <strong>위도(x):</strong> {deletePopup.x}&nbsp;&nbsp;
                      <strong>경도(y):</strong> {deletePopup.y}
                    </span>
                  </div>
                  {/* 건물일 때만 설명 입력란 + 이미지 표시 + 수정 버튼 */}
                  {deletePopup.type === "building" && (
                    <>
                      {/* 기존 이미지 표시 */}
                      {existingImageUrl && (
                        <div style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom: 6,
                              fontSize: 15,
                            }}
                          >
                            현재 건물 사진
                          </div>
                          <img
                            src={existingImageUrl}
                            alt="건물 사진"
                            style={{
                              width: "100%",
                              maxHeight: 200,
                              borderRadius: 8,
                              border: "1px solid #ddd",
                            }}
                          />
                        </div>
                      )}

                      {/* 설명 입력란 */}
                      <textarea
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          borderRadius: "25px",
                          border: "1px solid #e0e0e0",
                          fontSize: 16,
                          marginBottom: 0,
                          fontFamily: "inherit",
                          resize: "none",
                          background: "#fff",
                          color: "#333",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          boxSizing: "border-box",
                          minHeight: "120px",
                        }}
                        value={buildingDesc}
                        onChange={(e) => setBuildingDesc(e.target.value)}
                        placeholder="설명"
                      />

                      {/* 새 이미지 업로드 */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("file-input").click()
                            }
                            style={{
                              background: "#1976d2",
                              color: "white",
                              border: "none",
                              padding: "12px 20px",
                              borderRadius: "8px",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: 8,
                            }}
                          >
                            <span style={{ fontSize: 16 }}>+</span> 파일 추가
                          </button>
                        </div>

                        <input
                          id="file-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files)
                            setNewBuildingImages((prev) => [
                              ...prev,
                              ...newFiles,
                            ])
                            e.target.value = "" // 입력 필드 초기화
                          }}
                          style={{ display: "none" }}
                        />

                        {newBuildingImages.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#333",
                                marginBottom: 8,
                              }}
                            >
                              선택된 파일 ({newBuildingImages.length}개):
                            </div>
                            <div
                              style={{
                                maxHeight: 120,
                                overflowY: "auto",
                                border: "1px solid #e0e0e0",
                                borderRadius: "8px",
                                padding: "8px",
                              }}
                            >
                              {newBuildingImages.map((file, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    marginBottom: "4px",
                                    background: "#f8f9fa",
                                    borderRadius: "4px",
                                    fontSize: 13,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#333",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      flex: 1,
                                      marginRight: 8,
                                    }}
                                  >
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewBuildingImages((prev) =>
                                        prev.filter((_, i) => i !== index)
                                      )
                                    }}
                                    style={{
                                      background: "#dc3545",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      padding: "2px 6px",
                                      fontSize: 12,
                                      cursor: "pointer",
                                      minWidth: "20px",
                                      height: "20px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    title="삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewBuildingImages([])}
                              style={{
                                background: "#6c757d",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                fontSize: 12,
                                cursor: "pointer",
                                marginTop: 8,
                              }}
                            >
                              모든 파일 제거
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {/* 연결된 노드 (엣지 해제) */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      연결된 노드
                    </div>
                    {getConnectedNodes(deletePopup.node_name).length === 0 ? (
                      <div style={{ color: "#aaa", fontSize: 14 }}>
                        연결된 노드 없음
                      </div>
                    ) : (
                      getConnectedNodes(deletePopup.node_name).map(
                        (connectedNode) => (
                          <button
                            key={connectedNode}
                            type="button"
                            style={{
                              background: "#ffb300",
                              color: "#fff",
                              border: "none",
                              borderRadius: 18,
                              padding: "7px 18px",
                              fontSize: 15,
                              fontWeight: 600,
                              marginRight: 8,
                              marginBottom: 8,
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onClick={() =>
                              handleEdgeDisconnect(
                                deletePopup.node_name,
                                connectedNode
                              )
                            }
                          >
                            {connectedNode} 엣지 연결 해제
                          </button>
                        )
                      )
                    )}
                  </div>

                  {/* 하단 버튼 영역 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 12,
                      marginTop: 10,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 24,
                        border: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        background: "#eee",
                        color: "#333",
                        cursor: "pointer",
                      }}
                      onClick={handleCloseDeletePopup}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 24,
                        border: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        background: "#ff4d4f",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={handleDeleteNode}
                    >
                      삭제
                    </button>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 24,
                        border: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        background: "#0070f3",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => handleStartEdgeConnect(deletePopup)}
                    >
                      엣지 연결
                    </button>
                    {deletePopup.type === "building" && (
                      <button
                        type="button"
                        disabled={buildingDescLoading}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 24,
                          border: "none",
                          fontSize: 15,
                          fontWeight: 600,
                          background: "#0070f3",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                        onClick={handleUpdateBuildingDesc}
                      >
                        {buildingDescLoading ? "수정 중..." : "설명 수정"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 엣지 연결 안내 */}
      {edgeConnectHint && (
        <div
          style={{
            position: "fixed",
            top: 32, // 상단에서 32px 위치
            left: "50%", // 가로 가운데 위치
            transform: "translateX(-50%)", // 가로 방향으로 자기 너비의 절반만큼 왼쪽 이동하여 정확한 중앙 정렬
            zIndex: 3500,
            background: "#00C3FF",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          연결할 두 번째 노드를 클릭하세요!
        </div>
      )}
    </div>
  )
}

export default NaverMap
