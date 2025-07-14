"use client"
import { useEffect, useRef } from "react"

export default function NaverMapSimple() {
  const mapRef = useRef(null)

  useEffect(() => {
    // 우송대학교 중심 좌표
    const center = { lat: 36.3377622, lng: 127.4460928 }
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapRef.current
    )
      return

    // 지도 생성
    new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom: 17,
    })
  }, [])

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
