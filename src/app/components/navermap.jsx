import React, { useEffect, useRef } from "react"

function NaverMap({ setLatLng, nodes = [] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const clickMarkerRef = useRef(null)

  useEffect(() => {
    const { naver } = window
    if (!naver || !mapRef.current) return

    // 지도 최초 1회만 생성
    if (!mapInstance.current) {
      // 기본값(서울 시청)으로 생성
      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(37.5665, 126.978),
        zoom: 18,
      })
      mapInstance.current = map

      // 내 위치로 지도 중심 이동
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            map.setCenter(new naver.maps.LatLng(lat, lng))
            setLatLng && setLatLng({ lat, lng })
          },
          () => {
            // 위치 권한 거부 시 아무 동작 안 함
          }
        )
      }

      // 지도 클릭 시 기존 마커(파란색) 표시
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

  // nodes 바뀔 때마다 점(원)만 갱신
  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    // 기존 점(원) 제거
    circlesRef.current.forEach((circle) => circle.setMap(null))
    circlesRef.current = []

    // nodes가 객체(원본 서버 데이터)면 entries로 변환, 배열이면 그대로
    const nodeEntries = Array.isArray(nodes)
      ? nodes.map((n, idx) => [n.id || String(idx), n])
      : Object.entries(nodes)

    circlesRef.current = nodeEntries.map(
      ([id, { lat, lng }]) =>
        new naver.maps.Circle({
          map,
          center: new naver.maps.LatLng(lat, lng),
          radius: 5,
          fillColor: id && id.startsWith("O") ? "#ff0000" : "#0066ff",
          fillOpacity: 1,
          strokeColor: id && id.startsWith("O") ? "#ff0000" : "#0066ff",
          strokeOpacity: 1,
          strokeWeight: 2,
        })
    )
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
