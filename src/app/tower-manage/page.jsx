// tower-manage
"use client"
import React, { useState, useEffect } from "react"
import NaverMap from "./navermap"
import Menu from "../components/menu"
import "./tower-manage.css"

export default function TowerPage() {
  const [latLng, setLatLng] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nodes, setNodes] = useState({})

  // 건물 노드
  useEffect(() => {
    fetch("/api/tower-route")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.nodes) {
          setNodes(data.nodes)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className="tower-root">
      <div className="tower-header">맵 관리 페이지</div>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="tower-map-wrapper">
        <NaverMap setLatLng={setLatLng} nodes={nodes} menuOpen={menuOpen} />
      </div>
      {latLng && (
        <div className="latlng-display">
          <b>선택 좌표:</b> 위도 {latLng.lat}, 경도 {latLng.lng}
        </div>
      )}
    </div>
  )
}
