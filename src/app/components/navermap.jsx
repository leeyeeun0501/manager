import React, { useEffect, useRef, useState } from "react"

function NaverMap({ setLatLng }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const clickMarkerRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef([])

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  // 건물/노드 추가 팝업 상태
  const [addPopup, setAddPopup] = useState({
    open: false,
    x: null,
    y: null,
  })
  const [type, setType] = useState("building")
  const [nodeName, setNodeName] = useState("")
  const [desc, setDesc] = useState("")

  // 마커 클릭 시 노드 선택 팝업
  const [selectedNode, setSelectedNode] = useState(null)
  // 엣지 연결 모드: 첫 번째 노드가 선택된 상태
  const [edgeSource, setEdgeSource] = useState(null)
  const [edgeConnectHint, setEdgeConnectHint] = useState(false)

  // 노드/건물 선택 팝업 상태 추가
  const [deletePopup, setDeletePopup] = useState({
    open: false,
    id: null,
    node_name: "",
    type: "",
    x: null,
    y: null,
  })

  // 엣지 연결 모드 상태 추가
  const [edgeConnectMode, setEdgeConnectMode] = useState({
    active: false,
    fromNode: null, // { id, node_name }
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
      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(36.3360143, 127.4453897), // 우송대 중심
        zoom: 18,
      })
      mapInstance.current = map

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
          x: latlng.y, // 위도
          y: latlng.x, // 경도
        })
        setType("building")
        setNodeName("")
        setDesc("")
      })
    }
  }, [setLatLng])

  // 점(원) + 드래그 마커 처리 (tower-route로 PUT)
  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    // 기존 마커/원 초기화
    circlesRef.current.forEach((circle) => circle.setMap(null))
    markersRef.current.forEach((marker) => marker.setMap(null))
    circlesRef.current = []
    markersRef.current = []

    let nodesArray = Array.isArray(nodes)
      ? nodes
      : nodes && typeof nodes === "object"
      ? Object.entries(nodes).map(([id, value]) => ({ id, ...value }))
      : []

    const nodeEntries = nodesArray.map((n, idx) => [n.id || String(idx), n])

    nodeEntries.forEach(([id, { x, y, node_name }]) => {
      const isNode = id && id.startsWith("O") // 빨간색이면 node
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
        draggable: true,
        opacity: 0.1,
        title: node_name || id,
        zIndex: 100,
      })
      markersRef.current.push(marker)

      naver.maps.Event.addListener(marker, "click", function () {
        if (edgeConnectMode.active) {
          // 두 번째 노드 클릭: 엣지 연결 요청
          handleEdgeConnect(edgeConnectMode.fromNode, {
            id,
            node_name: node_name || id,
          })
        } else {
          // 평소처럼 삭제 팝업
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

    // ★ 최근 추가된 노드 자동 팝업
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
          type: id && id.startsWith("O") ? "node" : "building",
          x: n.x,
          y: n.y,
        })
        setRecentlyAddedNode(null)
      }
    }
  }, [nodes])

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

  // 건물/노드 추가 팝업 저장 처리
  async function handleAddNode(e) {
    e.preventDefault()
    if (!nodeName || addPopup.x == null || addPopup.y == null) {
      alert("이름과 위치를 입력하세요.")
      return
    }
    const body = {
      type,
      node_name: nodeName,
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
      setRecentlyAddedNode(nodeName) // ★ 추가: 최근 추가된 노드 이름 저장
      fetchNodes()
      fetchEdges()
      alert("추가 성공!")
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
        type: "",
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

  async function handleEdgeConnect(from, to) {
    if (!from?.node_name || !to?.node_name) {
      alert("노드 정보가 올바르지 않습니다.")
      setEdgeConnectMode({ active: false, fromNode: null })
      return
    }
    if (from.node_name === to.node_name) {
      alert("같은 노드는 연결할 수 없습니다.")
      setEdgeConnectMode({ active: false, fromNode: null })
      return
    }

    // 서버에 POST 요청
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
    setEdgeConnectMode({ active: false, fromNode: null })
    setEdgeConnectHint(false)
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
    setEdgeConnectHint(true) // 안내 메시지 표시
    // alert("연결할 두 번째 노드를 클릭하세요!") // 이 줄은 제거
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

      {/* 건물/노드 삭제 팝업 */}
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
            <strong>타입:</strong>{" "}
            {deletePopup.type === "building" ? "건물" : "노드"}
            <br />
            <strong>이름:</strong> {deletePopup.node_name}
            <br />
            <strong>위도(x):</strong> {deletePopup.x}
            <br />
            <strong>경도(y):</strong> {deletePopup.y}
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
