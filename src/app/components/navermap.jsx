import React, { useEffect, useRef, useState } from "react"

function NaverMap({ setLatLng, nodes = {} }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const clickMarkerRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef([])

  const [edges, setEdges] = useState([])

  // Function to fetch edges
  async function fetchEdges() {
    try {
      const res = await fetch("/api/node-route")
      const json = await res.json()
      setEdges(json.edges || [])
    } catch (e) {
      setEdges([])
    }
  }

  // 1. edges(노드 연결 정보) GET
  useEffect(() => {
    fetchEdges()
  }, [])

  // 2. 지도 최초 생성 및 클릭 마커
  useEffect(() => {
    const { naver } = window
    if (!naver || !mapRef.current) return

    if (!mapInstance.current) {
      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(37.5665, 126.978),
        zoom: 18,
      })
      mapInstance.current = map

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            map.setCenter(new naver.maps.LatLng(lat, lng))
            setLatLng && setLatLng({ lat, lng })
          },
          () => {}
        )
      }

      naver.maps.Event.addListener(map, "click", function (e) {
        const latlng = e.coord
        if (!clickMarkerRef.current) {
          clickMarkerRef.current = new naver.maps.Marker({
            position: latlng,
            map,
          })
        } else {
          clickMarkerRef.current.setPosition(latlng)
        }
        setLatLng && setLatLng({ lat: latlng.y, lng: latlng.x })
      })
    }
  }, [setLatLng])

  // 3. 점(원) + 드래그 마커 처리 (tower-route로 PUT)
  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    circlesRef.current.forEach((circle) => circle.setMap(null))
    markersRef.current.forEach((marker) => marker.setMap(null))
    circlesRef.current = []
    markersRef.current = []

    // nodes를 항상 배열로 변환 (객체로 올 수도 있음)
    let nodesArray = []
    if (Array.isArray(nodes)) {
      nodesArray = nodes
    } else if (nodes && typeof nodes === "object") {
      nodesArray = Object.entries(nodes).map(([id, value]) => ({
        id,
        ...value,
      }))
    } else {
      nodesArray = []
    }

    const nodeEntries = nodesArray.map((n, idx) => [n.id || String(idx), n])

    nodeEntries.forEach(([id, { x, y, node_name }]) => {
      // x: 위도(lat), y: 경도(lng)
      const circle = new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(x, y),
        radius: 2,
        fillColor: id && id.startsWith("O") ? "#ff0000" : "#0066ff",
        fillOpacity: 1,
        strokeColor: id && id.startsWith("O") ? "#ff0000" : "#0066ff",
        strokeOpacity: 1,
        strokeWeight: 2,
      })
      circlesRef.current.push(circle)

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(x, y),
        map,
        draggable: true,
        opacity: 0,
        title: node_name || id,
        zIndex: 100,
      })
      markersRef.current.push(marker)

      naver.maps.Event.addListener(marker, "dragend", async function (e) {
        const newLat = e.coord.y // 위도(lat)
        const newLng = e.coord.x // 경도(lng)
        circle.setCenter(new naver.maps.LatLng(newLat, newLng))
        try {
          await fetch("/api/tower-route", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              node_name: node_name || id,
              x: newLat, // 위도(lat)
              y: newLng, // 경도(lng)
            }),
          })
          // 좌표 수정 후 edges 다시 불러오기
          fetchEdges()
        } catch (err) {
          alert("서버에 좌표를 저장하는 데 실패했습니다.")
        }
      })
    })
  }, [nodes])

  // 4. Polyline(노드 선) 표시 (edges + nodes 매핑)
  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    // nodes를 항상 배열로 변환
    let nodesArray = []
    if (Array.isArray(nodes)) {
      nodesArray = nodes
    } else if (nodes && typeof nodes === "object") {
      nodesArray = Object.entries(nodes).map(([id, value]) => ({
        id,
        ...value,
      }))
    } else {
      nodesArray = []
    }

    // 노드 id → 좌표 매핑 (x: 위도, y: 경도)
    const nodeCoordMap = {}
    nodesArray.forEach((n) => {
      nodeCoordMap[n.id] = { x: n.x, y: n.y }
    })

    // 기존 선 제거
    if (polylineRef.current && Array.isArray(polylineRef.current)) {
      polylineRef.current.forEach((line) => line.setMap(null))
    }
    polylineRef.current = []

    // 중복 연결 방지용 Set
    const drawnSet = new Set()

    // 각 edge의 id(건물)와 nodes의 node(연결노드)들을 1:1로 연결
    edges.forEach((edge) => {
      const fromCoord = nodeCoordMap[edge.id]
      if (!fromCoord) return
      ;(edge.nodes || []).forEach((n) => {
        const toCoord = nodeCoordMap[n.node]
        if (!toCoord) return
        // 중복 방지 키 (A-B, B-A 모두 같은 키)
        const key = [edge.id, n.node].sort().join("-")
        if (drawnSet.has(key)) return
        drawnSet.add(key)
        const path = [
          new naver.maps.LatLng(fromCoord.x, fromCoord.y), // x: 위도, y: 경도
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

  return (
    <div
      ref={mapRef}
      style={{
        width: "1000px",
        height: "600px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    />
  )
}

export default NaverMap
