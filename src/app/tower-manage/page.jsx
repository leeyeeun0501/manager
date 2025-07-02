"use client"
import React, { useState, useEffect } from "react"
import NaverMap from "../components/navermap"
import Menu from "../components/menu"
import "./tower-manage.css"

export default function TowerPage() {
  const [latLng, setLatLng] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    fetch("/api/tower-route")
      .then((res) => res.json())
      .then((data) => {
        console.log("서버에서 받은 원본 데이터:", data)
        if (data && data.nodes) {
          const nodesArray = Object.entries(data.nodes).map(([id, value]) => ({
            id,
            lat: value.lat,
            lng: value.lng,
          }))
          console.log("변환된 nodes 배열:", nodesArray)
          setNodes(nodesArray)
        } else {
          console.log("data.nodes가 없음", data)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    console.log("nodes 상태값 변경됨:", nodes)
  }, [nodes])

  return (
    <div className="tower-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="tower-centerbox">
        <h2 className="tower-header">경로/건물 위치 관리</h2>
        <div className="tower-map-wrapper">
          <NaverMap setLatLng={setLatLng} nodes={nodes} />
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
