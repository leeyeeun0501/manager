"use client"
import { useEffect, useRef } from "react"

export default function NaverMapSimple({ markers = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerObjsRef = useRef([])

  useEffect(() => {
    const center = { lat: 36.3377622, lng: 127.4460928 } // 우송대
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapRef.current
    )
      return

    mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom: 17,
    })
  }, [])

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapInstanceRef.current
    )
      return

    // 기존 마커 제거
    markerObjsRef.current.forEach((m) => m.setMap(null))
    markerObjsRef.current = []

    // 사용자 위치만 마커로 표시
    markers.forEach(({ last_location }) => {
      if (!last_location) return
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          last_location.lat,
          last_location.lng
        ),
        map: mapInstanceRef.current,
      })
      markerObjsRef.current.push(marker)
    })
  }, [markers])

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "18px",
        border: "1.5px solid #222",
        background: "#eee",
        margin: "0 auto",
      }}
    />
  )
}
