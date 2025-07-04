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

  // 최초 nodes, edges 모두 fetch
  useEffect(() => {
    fetchNodes()
    fetchEdges()
  }, [])

  // 지도 최초 생성 및 클릭 마커 + 추가 팝업
  useEffect(() => {
    const { naver } = window
    if (!naver || !mapRef.current) return

    if (!mapInstance.current) {
      // 복원할 위치/줌 읽기
      let center = new naver.maps.LatLng(36.3360143, 127.4453897)
      let zoom = 18
      try {
        const saved = JSON.parse(localStorage.getItem("naverMapCenter"))
        if (saved && saved.lat && saved.lng) {
          center = new naver.maps.LatLng(saved.lat, saved.lng)
        }
        const savedZoom = parseInt(localStorage.getItem("naverMapZoom"), 10)
        if (!isNaN(savedZoom)) zoom = savedZoom
      } catch (e) {}

      const map = new naver.maps.Map(mapRef.current, {
        center,
        zoom,
      })
      mapInstance.current = map

      // ★ 여기서 바로 삭제!
      localStorage.removeItem("naverMapCenter")
      localStorage.removeItem("naverMapZoom")

      naver.maps.Event.addListener(map, "click", function (e) {
        const latlng = e.coord
        if (!clickMarkerRef.current) {
          clickMarkerRef.current = new naver.maps.Marker({
            position: latlng,
            map,
            zIndex: 999,
          })
        } else {
          clickMarkerRef.current.setPosition(latlng)
        }
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

  // 마커/원/이벤트 등록 (nodes, edges, recentlyAddedNode가 바뀔 때마다)
  useEffect(() => {
    const { naver } = window
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
        console.log("마커 클릭됨", id, node_name)
        if (edgeConnectMode.active) {
          if (
            edgeConnectMode.fromNode &&
            edgeConnectMode.fromNode.node_name === (node_name || id)
          ) {
            setEdgeConnectMode({ active: false, fromNode: null })
            setEdgeConnectHint(false)
            alert("같은 노드는 연결할 수 없습니다.")
            return
          }
          const alreadyConnected = edges.some(
            (edge) =>
              (edge.id === edgeConnectMode.fromNode.node_name &&
                edge.nodes.some((n) => n.node === (node_name || id))) ||
              (edge.id === (node_name || id) &&
                edge.nodes.some(
                  (n) => n.node === edgeConnectMode.fromNode.node_name
                ))
          )
          if (alreadyConnected) {
            setEdgeConnectMode({ active: false, fromNode: null })
            setEdgeConnectHint(false)
            alert("이미 연결된 노드입니다.")
            return
          }
          handleEdgeConnect(edgeConnectMode.fromNode, {
            id,
            node_name: node_name || id,
          })
          setEdgeConnectMode({ active: false, fromNode: null })
          setEdgeConnectHint(false)
          return
        }
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
    const { naver } = window
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
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{
          width: "1000px",
          height: "600px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      />

      {/* 건물/노드 추가 팝업 */}
      {addPopup.open && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            zIndex: 2000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            width: 320,
          }}
        >
          <h3 style={{ marginTop: 0 }}>노드/건물 추가</h3>
          <form onSubmit={handleAddNode}>
            <div style={{ marginBottom: 12 }}>
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
              <label style={{ marginLeft: 16 }}>
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
              <div style={{ marginBottom: 12 }}>
                <label>
                  이름
                  <br />
                  <input
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    style={{ width: "100%" }}
                    required
                  />
                </label>
              </div>
            )}
            {type === "node" && (
              <div style={{ marginBottom: 12 }}>
                <strong>자동 생성 노드명:</strong> {getNextONodeName()}
              </div>
            )}
            {type === "building" && (
              <div style={{ marginBottom: 12 }}>
                <label>
                  설명
                  <br />
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    style={{ width: "100%" }}
                    rows={3}
                  />
                </label>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <strong>위도(x):</strong> {addPopup.x}
              <br />
              <strong>경도(y):</strong> {addPopup.y}
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={handleClosePopup}
                style={{ marginRight: 8 }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  background: "#00C3FF",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 18px",
                }}
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 건물/노드 삭제/엣지 팝업 */}
      {deletePopup.open && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 40,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            zIndex: 2000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            width: 320,
          }}
        >
          <h3 style={{ marginTop: 0 }}>노드/건물 삭제</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>이름:</strong> {deletePopup.node_name}
            <br />
            <strong>위도(x):</strong> {deletePopup.x}
            <br />
            <strong>경도(y):</strong> {deletePopup.y}
          </div>
          {/* 엣지 해제 버튼 목록 */}
          <div style={{ marginBottom: 12 }}>
            <strong>엣지 연결 해제:</strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 8px",
                marginTop: 6,
              }}
            >
              {getConnectedNodes(deletePopup.id).length === 0 && (
                <span style={{ color: "#888" }}>연결된 노드 없음</span>
              )}
              {getConnectedNodes(deletePopup.id).map((otherId) => (
                <button
                  key={otherId}
                  type="button"
                  style={{
                    background: "#ffb300",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 12px",
                    fontSize: "0.95em",
                    cursor: "pointer",
                  }}
                  onClick={() => handleEdgeDisconnect(deletePopup.id, otherId)}
                >
                  {otherId} 엣지 연결 해제
                </button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button
              type="button"
              onClick={handleCloseDeletePopup}
              style={{ marginRight: 8 }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDeleteNode}
              style={{
                background: "#ff4d4f",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 18px",
              }}
            >
              삭제
            </button>
            <button
              type="button"
              onClick={() => handleStartEdgeConnect(deletePopup)}
              style={{
                background: "#00C3FF",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 18px",
                marginLeft: 8,
              }}
            >
              엣지 연결
            </button>
          </div>
        </div>
      )}

      {edgeConnectHint && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#00C3FF",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: "bold",
            zIndex: 3000,
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
