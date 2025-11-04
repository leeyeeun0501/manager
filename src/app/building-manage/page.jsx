// building-manage
"use client"
import "../globals.css"
import React, { useState, useEffect, useCallback } from "react"
import NaverMap from "./navermap"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import { apiGet, parseJsonResponse } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"
import styles from "./building-manage.module.css"
import "./building-manage-globals.css"

export default function TowerPage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const [latLng, setLatLng] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nodes, setNodes] = useState({})
  const [loading, setLoading] = useState(true)

  // 건물 노드
  const fetchNodes = useCallback(async () => {
    try {
      const res = await apiGet("/api/tower-route")
      const data = await parseJsonResponse(res)
      if (data && data.nodes) {
        setNodes(data.nodes)
      }
    } catch (err) {
      // 에러는 조용히 처리 (사용자에게는 LoadingOverlay로 표시됨)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNodes()
  }, [fetchNodes])

  return (
    <div className={styles.towerRoot}>
      {loading && <LoadingOverlay />}
      <div className={styles.towerHeader}>맵 관리 페이지</div>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles.towerMapWrapper}>
        <NaverMap setLatLng={setLatLng} nodes={nodes} menuOpen={menuOpen} />
      </div>
      {latLng && (
        <div className={styles.latlngDisplay}>
          <b>선택 좌표:</b> 위도 {latLng.lat}, 경도 {latLng.lng}
        </div>
      )}
    </div>
  )
}
