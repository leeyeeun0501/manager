import React, { useEffect, useRef } from "react"

function NaverMap({ setLatLng }) {
  const mapRef = useRef(null)

  useEffect(() => {
    const { naver } = window
    if (!naver || !mapRef.current) return

    let initialLat = 37.5665
    let initialLng = 126.978

    let map = null
    let marker = null

    function createMap(lat, lng) {
      map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(lat, lng),
        zoom: 16, // ← 더 확대해서 보려면 15~17 권장
      })

      marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map,
      })

      setLatLng && setLatLng({ lat, lng })

      naver.maps.Event.addListener(map, "click", function (e) {
        const latlng = e.coord
        marker.setPosition(latlng)
        setLatLng && setLatLng({ lat: latlng.y, lng: latlng.x })
      })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          createMap(lat, lng)
        },
        () => {
          createMap(initialLat, initialLng)
        }
      )
    } else {
      createMap(initialLat, initialLng)
    }
  }, [setLatLng])

  return (
    <div
      ref={mapRef}
      style={{
        width: "1000px", // 가로 크기를 800px로 고정
        height: "600px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    />
  )
}

export default NaverMap
