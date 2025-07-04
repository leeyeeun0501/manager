"use client"
import React, { useEffect, useRef, useState } from "react"

function NaverMap({ setLatLng, isLoggedIn }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const clickMarkerRef = useRef(null)
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

  const [selectedMarker, setSelectedMarker] = useState(null)

  // 최초 nodes, edges 모두 fetch
  useEffect(() => {
    fetchNodes()
    fetchEdges()
  }, [])

  // 지도 최초 생성 및 클릭 마커 + 추가 팝업
  useEffect(() => {
    if (typeof window === "undefined" || !window.naver || !mapRef.current)
      return

    if (!mapInstance.current) {
      let center = new window.naver.maps.LatLng(36.3360143, 127.4453897)
      let zoom = 18
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

      // ★ 여기서 바로 삭제!
      localStorage.removeItem("naverMapCenter")
      localStorage.removeItem("naverMapZoom")

      naver.maps.Event.addListener(map, "click", function (e) {
        const latlng = e.coord
        setDeletePopup({
          open: false,
          id: null,
          node_name: "",
          type: "",
          x: null,
          y: null,
        })
        setAddPopup({
          open: true,
          x: latlng.y,
          y: latlng.x,
        })
        setNodeName("")
        setDesc("")
      })
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!window.naver || !mapInstance.current) return
    if (!nodes || nodes.length === 0) return

    // 모든 노드의 x, y 평균값 계산
    const xs = nodes.map((n) => n.x).filter((x) => typeof x === "number")
    const ys = nodes.map((n) => n.y).filter((y) => typeof y === "number")
    if (xs.length === 0 || ys.length === 0) return

    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length
    const avgY = ys.reduce((a, b) => a + b, 0) / ys.length

    // 지도 중심 이동
    mapInstance.current.setCenter(new window.naver.maps.LatLng(avgX, avgY))
  }, [nodes])

  // 마커/원/이벤트 등록 (nodes, edges, recentlyAddedNode가 바뀔 때마다)
  useEffect(() => {
    const naver = window.naver
    const map = mapInstance.current
    if (!naver || !map) return

    // 1. 기존 마커/원 완전 초기화 (안전하게!)
    if (Array.isArray(circlesRef.current)) {
      circlesRef.current.forEach((circle) => {
        if (circle && typeof circle.setMap === "function") {
          try {
            circle.setMap(null)
          } catch (e) {
            // 이미 해제된 객체라면 오류 무시
          }
        }
      })
    }
    if (Array.isArray(markersRef.current)) {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.setMap === "function") {
          try {
            marker.setMap(null)
          } catch (e) {
            // 이미 해제된 객체라면 오류 무시
          }
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

      // 원(circle) 생성 및 클릭 이벤트
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

      // 마커 생성 및 클릭 이벤트
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

      // 마커 클릭 이벤트
      naver.maps.Event.addListener(marker, "click", function () {
        if (edgeConnectMode.active) return
        // 팝업 상태를 확실히 하나만!
        setAddPopup({ open: false, x: null, y: null })
        setDeletePopup({
          open: true,
          id,
          node_name: node_name || id,
          type,
          x,
          y,
        })
      })

      // 원 클릭 이벤트도 동일하게 등록 (혹시 원 위에 마커가 겹쳐서 클릭 안 되는 경우 대비)
      naver.maps.Event.addListener(circle, "click", function () {
        setAddPopup({ open: false, x: null, y: null })
        setDeletePopup({
          open: true,
          id,
          node_name: node_name || id,
          type,
          x,
          y,
        })
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

  function getNextONodeName() {
    const oNumbers = nodes
      .map((n) => n.id || n.node_name)
      .filter((id) => typeof id === "string" && id.startsWith("O"))
      .map((id) => parseInt(id.slice(1), 10))
      .filter((num) => !isNaN(num))
    const maxO = oNumbers.length > 0 ? Math.max(...oNumbers) : 0
    return "O" + (maxO + 1)
  }

  // 건물/노드 추가 팝업 저장 처리
  async function handleAddNode(e) {
    e.preventDefault()
    if (addPopup.x == null || addPopup.y == null) {
      alert("위치를 선택하세요.")
      return
    }

    let finalNodeName = nodeName
    if (type === "node") {
      finalNodeName = getNextONodeName()
    }

    const body = {
      type,
      node_name: finalNodeName,
      x: addPopup.x,
      y: addPopup.y,
    }
    if (type === "building") {
      body.desc = desc
    }
    const res = await fetch("/api/tower-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      setAddPopup({ open: false, x: null, y: null })

      // fetchNodes와 fetchEdges를 반드시 await로 순차 실행!
      await fetchNodes()
      await fetchEdges()

      // 지도 위치/줌 저장
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

      setRecentlyAddedNode(finalNodeName)
      alert("추가 성공!")
      window.location.reload()
    } else {
      alert(data.error || "추가 실패")
    }
  }

  // 삭제 처리 함수
  async function handleDeleteNode() {
    if (!deletePopup.type || !deletePopup.node_name) return
    if (!window.confirm("정말 삭제하시겠습니까?")) return
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

  // --- 엣지 연결 함수: 1:1 연결만 허용 ---
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

  // --- 엣지 연결 해제 함수 ---
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

  function handleCloseDeletePopup() {
    setDeletePopup({
      open: false,
      id: null,
      node_name: "",
      type: "",
      x: null,
      y: null,
    })
  }

  function handleClosePopup() {
    setAddPopup({ open: false, x: null, y: null })
  }

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
            top: 80, // 햄버거 메뉴(상단바)와 겹치지 않게 여백
            left: 32, // 왼쪽 여백
            zIndex: 3000,
            // 중앙 오버레이 배경이 필요하면 아래 주석 해제
            // background: "rgba(0,0,0,0.08)",
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

            {/* 추가 폼 */}
            {addPopup.open && (
              <form
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
                onSubmit={handleAddNode}
              >
                <div style={{ display: "flex", gap: 18, marginBottom: 8 }}>
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
                {type === "building" && (
                  <>
                    <input
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 18,
                        border: "1px solid #bbb",
                        fontSize: 16,
                        marginBottom: 0,
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
                        padding: 12,
                        borderRadius: 18,
                        border: "1px solid #bbb",
                        fontSize: 16,
                        marginBottom: 0,
                      }}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="설명"
                      rows={3}
                    />
                  </>
                )}
                {type === "node" && (
                  <div style={{ fontSize: 15, color: "#555" }}>
                    <strong>자동 생성 노드명:</strong> {getNextONodeName()}
                  </div>
                )}
                <div style={{ fontSize: 15, color: "#555" }}>
                  <strong>위도(x):</strong> {addPopup.x} <br />
                  <strong>경도(y):</strong> {addPopup.y}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 10,
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
            )}

            {/* 삭제/엣지 관리 */}
            {deletePopup.open && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div style={{ fontSize: 15, color: "#555" }}>
                  <strong>이름:</strong> {deletePopup.node_name} <br />
                  <strong>위도(x):</strong> {deletePopup.x} <br />
                  <strong>경도(y):</strong> {deletePopup.y}
                </div>
                <div style={{ fontSize: 15, color: "#555" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 8px",
                      marginTop: 6,
                    }}
                  >
                    {getConnectedNodes(deletePopup.id).length === 0 && (
                      <span style={{ color: "#aaa", fontSize: 14 }}>
                        연결된 노드 없음
                      </span>
                    )}
                    {getConnectedNodes(deletePopup.id).map((otherId) => (
                      <button
                        key={otherId}
                        type="button"
                        style={{
                          background: "#ffb300",
                          color: "#fff",
                          border: "none",
                          borderRadius: 16,
                          padding: "7px 14px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          handleEdgeDisconnect(deletePopup.id, otherId)
                        }
                      >
                        {otherId} 엣지 해제
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 10,
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
                    onClick={handleCloseDeletePopup}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "10px 22px",
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
                      padding: "10px 22px",
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
            top: 32,
            left: 410, // 패널(360px) + 여백(32px) + 여유(18px)
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
