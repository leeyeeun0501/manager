"use client"
import { useEffect, useRef } from "react"

function createSpeechBubbleMarkerContent(userId) {
  return `
    <div style="
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 42px;
      height: 34px;
      border-radius: 11px;
      background: white;
      border: 1.5px solid #111;
      font-weight: bold;
      font-size: 17px;
      color: #111;
      box-shadow: 0px 2px 6px rgba(0,0,0,0.08);
      text-align: center;
      word-break: break-all;
      white-space: normal;
      line-height: 1.1;
      letter-spacing: 1px;
      padding: 2px 3px 0 3px;
    ">
      <span style="z-index:1; font-family:sans-serif;">${userId}</span>
      <div style="position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%);
        width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-top: 8px solid #111; z-index:0;"></div>
      <div style="position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
        width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent;
        border-top: 7px solid #fff; z-index:1;"></div>
    </div>
  `
}

export default function NaverMapSimple({ markers = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerObjsRef = useRef([])

  useEffect(() => {
    const center = { lat: 36.3377622, lng: 127.4460928 }
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

    markerObjsRef.current.forEach((m) => m.setMap(null))
    markerObjsRef.current = []

    markers.forEach(({ id, last_location }) => {
      if (!last_location) return
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          last_location.lat,
          last_location.lng
        ),
        map: mapInstanceRef.current,
        title: id,
        icon: {
          content: createSpeechBubbleMarkerContent(id),
          size: new window.naver.maps.Size(42, 42),
          anchor: new window.naver.maps.Point(21, 38),
        },
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
