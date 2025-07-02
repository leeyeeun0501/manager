import React, { useEffect, useRef } from "react"

function NaverMap({ setLatLng, nodes = [] }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const circlesRef = useRef([])
  const myLocationCircleRef = useRef(null) // 현재 위치 점

  // 지도는 최초 1회만 생성
  useEffect(() => {
    const { naver } = window
    if (!naver || !mapRef.current) return

    if (!mapInstance.current) {
      let initialLat = nodes.length > 0 ? nodes[0].lat : 37.5665
      let initialLng = nodes.length > 0 ? nodes[0].lng : 126.978

      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(initialLat, initialLng),
        zoom: 19,
      })
      mapInstance.current = map

      // 클릭 마커 (1개)
      let clickCircle = null
      naver.maps.Event.addListener(map, "click", function (e) {
        const latlng = e.coord
        if (!clickCircle) {
          clickCircle = new naver.maps.Circle({
            map,
            center: latlng,
            radius: 5, // 미터 단위, 작게 하고 싶으면 3~7 정도
            fillColor: "#ff0000",
            fillOpacity: 1,
            strokeColor: "#ff0000",
            strokeOpacity: 1,
            strokeWeight: 2,
          })
        } else {
          clickCircle.setCenter(latlng)
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
          if (!myLocationCircleRef) {
            myLocationCircleRef = new naver.maps.Marker({
              position: new naver.maps.LatLng(lat, lng),
              map,
            })
          } else {
            myLocationCircleRef.setPosition(new naver.maps.LatLng(lat, lng))
          }
        })
      }
    }
  }, [setLatLng, nodes])

  // nodes 바뀔 때마다 점(원)만 갱신
  useEffect(() => {
    const { naver } = window
    const map = mapInstance.current
    if (!naver || !map) return

    // 기존 점(원) 제거
    circlesRef.current.forEach((circle) => circle.setMap(null))
    circlesRef.current = []

    // 새 점(원) 추가
    if (Array.isArray(nodes)) {
      circlesRef.current = nodes.map(
        ({ lat, lng }) =>
          new naver.maps.Circle({
            map,
            center: new naver.maps.LatLng(lat, lng),
            radius: 5, // 미터 단위, 작게 하고 싶으면 3~7 정도
            fillColor: "#0066ff",
            fillOpacity: 1,
            strokeColor: "#0066ff",
            strokeOpacity: 1,
            strokeWeight: 2,
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
