import React, { useEffect, useRef } from "react"

function NaverMap({ setLatLng, nodes = [] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])

  // 지도는 최초 1회만 생성
  useEffect(() => {
    const { naver } = window
    if (!naver || !mapRef.current) return

    if (!mapInstance.current) {
      let initialLat = nodes.length > 0 ? nodes[0].lat : 37.5665
      let initialLng = nodes.length > 0 ? nodes[0].lng : 126.978

      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(initialLat, initialLng),
        zoom: 16,
      })
      mapInstance.current = map

      // 클릭 마커 (1개)
      let clickMarker = null
      naver.maps.Event.addListener(map, "click", function (e) {
        const latlng = e.coord
        if (!clickMarker) {
          clickMarker = new naver.maps.Marker({
            position: latlng,
            map,
          })
        } else {
          clickMarker.setPosition(latlng)
        }
        setLatLng && setLatLng({ lat: latlng.y, lng: latlng.x })
      })

      // 위치 권한 있을 때 지도 중심 이동
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          map.setCenter(new naver.maps.LatLng(lat, lng))
          setLatLng && setLatLng({ lat, lng })
          if (!clickMarker) {
            clickMarker = new naver.maps.Marker({
              position: new naver.maps.LatLng(lat, lng),
              map,
            })
          } else {
            clickMarker.setPosition(new naver.maps.LatLng(lat, lng))
          }
        })
      }
    }
  }, [setLatLng, nodes])

  // nodes 바뀔 때마다 마커만 갱신
  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // 새 마커 추가
    if (Array.isArray(nodes)) {
      markersRef.current = nodes.map(
        ({ lat, lng, id }) =>
          new naver.maps.Marker({
            position: new naver.maps.LatLng(lat, lng),
            map,
            title: id,
          })
      )
    }
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
