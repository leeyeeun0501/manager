"use client"
import React, { useState } from "react"
import NaverMap from "../components/navermap"
import Menu from "../components/menu"
import "./tower-manage.css"

export default function TowerPage() {
  const [latLng, setLatLng] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="tower-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="tower-centerbox">
        <h2 className="tower-header">타워 위치 관리</h2>
        <div className="tower-map-wrapper">
          <NaverMap setLatLng={setLatLng} />
        </div>
        {latLng && (
          <div className="latlng-display">
            <b>선택 좌표:</b> 위도 {latLng.lat}, 경도 {latLng.lng}
          </div>
        )}
      </div>
    </div>
  )
}
