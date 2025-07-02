import React, { useEffect, useRef } from "react"

function NaverMap({ setLatLng, nodes = [] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const clickMarkerRef = useRef(null)
  const markersRef = useRef([])

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

  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    circlesRef.current.forEach((circle) => circle.setMap(null))
    markersRef.current.forEach((marker) => marker.setMap(null))
    circlesRef.current = []
    markersRef.current = []

    const nodeEntries = Array.isArray(nodes)
      ? nodes.map((n, idx) => [n.id || String(idx), n])
      : Object.entries(nodes)

    nodeEntries.forEach(([id, { lat, lng, node_name }]) => {
      const circle = new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(lat, lng),
        radius: 5,
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

      // ✅ 여기만 수정!
      naver.maps.Event.addListener(marker, "dragend", async function (e) {
        const newLng = e.coord.x // 경도
        const newLat = e.coord.y // 위도
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
        } catch (err) {
          alert("서버에 좌표를 저장하는 데 실패했습니다.")
        }
      })
    })
  }, [nodes])

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
