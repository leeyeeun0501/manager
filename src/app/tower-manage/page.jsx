"use client"
import React, { useState } from "react"
import NaverMap from "../components/navermap"
import Menu from "../components/menu"

export default function TowerPage() {
  const [latLng, setLatLng] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 24 }}>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <h2 style={{ marginBottom: 24 }}>타워 위치 관리</h2>
      <NaverMap setLatLng={setLatLng} />
      {latLng && (
        <div style={{ marginTop: 16, fontSize: 16 }}>
          <b>선택 좌표:</b> 위도 {latLng.lat}, 경도 {latLng.lng}
        </div>
      )}
    </div>
  )
}
