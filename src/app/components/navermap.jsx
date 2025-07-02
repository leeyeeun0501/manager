import React, { useEffect, useRef, useState } from "react"

function NaverMap({ setLatLng, nodes = [] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const clickMarkerRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef([])

  const [edges, setEdges] = useState([])

  // 1. edges(노드 연결 정보) GET
  useEffect(() => {
    async function fetchEdges() {
      try {
        const res = await fetch("/api/node-route")
        const json = await res.json()
        setEdges(json.edges || [])
      } catch (e) {
        setEdges([])
      }
    }
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

    const nodeEntries = nodesArray.map((n, idx) => [n.id || String(idx), n])

    nodeEntries.forEach(([id, { lat, lng, node_name }]) => {
      const circle = new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(lat, lng),
        radius: 2,
        fillColor: id && id.startsWith("O") ? "#ff0000" : "#0066ff",
        fillOpacity: 1,
        strokeColor: id && id.startsWith("O") ? "#ff0000" : "#0066ff",
        strokeOpacity: 1,
        strokeWeight: 2,
      })
      circlesRef.current.push(circle)

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map,
        draggable: true,
        opacity: 0,
        title: node_name || id,
        zIndex: 100,
      })
      markersRef.current.push(marker)

      naver.maps.Event.addListener(marker, "dragend", async function (e) {
        const newLat = e.coord.y // 위도
        const newLng = e.coord.x // 경도
        circle.setCenter(new naver.maps.LatLng(newLat, newLng))
        try {
          await fetch("/api/tower-route", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              node_name: node_name || id,
              x: newLng, // 경도(lng)
              y: newLat, // 위도(lat)
            }),
          })
        } catch (err) {
          alert("서버에 좌표를 저장하는 데 실패했습니다.")
        }
      })
    })
  }, [nodes.length]) // 의존성 배열: nodes.length

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

    // 노드 id → 좌표 매핑
    const nodeCoordMap = {}
    nodesArray.forEach((n) => {
      nodeCoordMap[n.id] = { lat: n.lat, lng: n.lng }
    })

    // 기존 선 제거
    if (polylineRef.current && Array.isArray(polylineRef.current)) {
      polylineRef.current.forEach((line) => line.setMap(null))
    }
    polylineRef.current = []

    // 각 edge별로 Polyline 생성 (nodes가 2개 이상일 때만)
    edges.forEach((edge) => {
      const path = (edge.nodes || [])
        .map((n) => nodeCoordMap[n.node])
        .filter((coord) => coord)
        .map((coord) => new naver.maps.LatLng(coord.lat, coord.lng))
      if (path.length > 1) {
        const polyline = new naver.maps.Polyline({
          map,
          path,
          strokeColor: "#00C3FF",
          strokeWeight: 4,
          strokeOpacity: 0.8,
          strokeStyle: "solid",
        })
        polylineRef.current.push(polyline)
      }
    })
  }, [edges.length, nodes.length]) // 의존성 배열: edges.length, nodes.length

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
