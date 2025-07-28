// navermap
"use client"
import { useEffect, useRef, useState } from "react"

// 마커 팝업 컨텐츠 생성
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

  const [ready, setReady] = useState(false)

  // 1. 네이버 지도 스크립트 중복 삽입 없이 1회만 로딩
  useEffect(() => {
    if (typeof window === "undefined") return
    const existing = document.querySelector('script[src*="maps.js"]')
    if (existing) {
      if (window.naver && window.naver.maps) setReady(true)
      else existing.addEventListener("load", () => setReady(true))
      return
    }
    const script = document.createElement("script")
    script.src =
      "https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=yxffktqahm"
    script.async = true
    script.onload = () => setReady(true)
    document.head.appendChild(script)
    // cleanup 생략(한 번만 로드)
  }, [])

  // 2. ready (스크립트 로드 완료) 후, 지도 객체 단 한번 생성
  useEffect(() => {
    if (!ready) return
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapRef.current
    )
      return
    if (!mapInstanceRef.current) {
      // center/zoom from localStorage → 없으면 기본값
      let center = new window.naver.maps.LatLng(36.3377622, 127.4460928)
      let zoom = 17
      try {
        const saved = JSON.parse(localStorage.getItem("naverMapCenter"))
        if (saved && saved.lat && saved.lng) {
          center = new window.naver.maps.LatLng(saved.lat, saved.lng)
        }
        const savedZoom = parseInt(localStorage.getItem("naverMapZoom"), 10)
        if (!isNaN(savedZoom)) zoom = savedZoom
      } catch (e) {}
      const map = new window.naver.maps.Map(mapRef.current, { center, zoom })
      mapInstanceRef.current = map
      localStorage.removeItem("naverMapCenter")
      localStorage.removeItem("naverMapZoom")
    }
  }, [ready])

  // 3. markers가 변경될 때마다 마커 갱신
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapInstanceRef.current
    )
      return

    // 기존 marker 모두 제거
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
  }, [markers, ready])

  return (
    <div
      ref={mapRef}
      style={{
        width: "120%",
        height: "650px",
        borderRadius: "18px",
        border: "1.5px solid #222",
        background: "#eee",
        margin: "0 auto",
        transform: "translateX(-10%)",
      }}
    />
  )
}
