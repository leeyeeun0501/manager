import React, { useEffect, useRef } from "react"

function NaverMap({ setLatLng }) {
  const mapRef = useRef(null)

  useEffect(() => {
    // 네이버 지도 객체가 로드됐는지 체크
    const { naver } = window
    if (!naver || !mapRef.current) return

    // 지도 생성 (초기 위치: 서울)
    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(37.5665, 126.978),
      zoom: 13,
    })

    let marker = null

    // 지도 클릭 이벤트
    naver.maps.Event.addListener(map, "click", function (e) {
      const latlng = e.coord
      if (marker) {
        marker.setPosition(latlng)
      } else {
        marker = new naver.maps.Marker({
          position: latlng,
          map,
        })
      }
      // 부모로 위도, 경도 전달
      setLatLng && setLatLng({ lat: latlng.y, lng: latlng.x })
    })
  }, [setLatLng])

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    />
  )
}

export default NaverMap
