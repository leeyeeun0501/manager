// 메인 management
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import styles from "./management.module.css"
import NaverMapSimple from "./navermap"
import "../globals.css"

export default function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [summary, setSummary] = useState({
    building: 0,
    classroom: 0,
    user: 0,
  })
  const [userMarkers, setUserMarkers] = useState([])

  // 건물, 강의실, 사용자 수
  useEffect(() => {
    fetch("/api/building-route?type=names")
      .then((res) => res.json())
      .then((data) => {
        setSummary((prev) => ({
          ...prev,
          building: Array.isArray(data.names) ? data.names.length : 0,
        }))
      })
    fetch("/api/room-route")
      .then((res) => res.json())
      .then((data) => {
        setSummary((prev) => ({
          ...prev,
          classroom: Array.isArray(data.rooms) ? data.rooms.length : 0,
        }))
      })
    fetch("/api/user-route")
      .then((res) => res.json())
      .then((data) => {
        setSummary((prev) => ({
          ...prev,
          user: Array.isArray(data.users) ? data.users.length : 0,
        }))
      })
  }, [])

  // 로그인
  useEffect(() => {
    fetch("/api/login-route")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const markers = data
            .filter(
              (u) =>
                u.Last_Location &&
                typeof u.Last_Location.x === "number" &&
                typeof u.Last_Location.y === "number"
            )
            .map((u) => ({
              id: u.Id,
              name: u.Name,
              last_location: {
                lat: u.Last_Location.x,
                lng: u.Last_Location.y,
              },
            }))
          setUserMarkers(markers)
        }
      })
  }, [])

  return (
    <div className={styles["management-root"]}>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className={styles["management-content"]}>
        <div className={styles["dashboard-summary-row"]}>
          <div className={styles["dashboard-summary-box"]}>
            <div className={styles["summary-label"]}>건물 수</div>
            <div className={styles["summary-value"]}>{summary.building}</div>
          </div>
          <div className={styles["dashboard-summary-box"]}>
            <div className={styles["summary-label"]}>강의실 수</div>
            <div className={styles["summary-value"]}>{summary.classroom}</div>
          </div>
          <div className={styles["dashboard-summary-box"]}>
            <div className={styles["summary-label"]}>사용자 수</div>
            <div className={styles["summary-value"]}>{summary.user}</div>
          </div>
        </div>
        {/* 사용자 위치 마커 지도 */}
        <NaverMapSimple markers={userMarkers} />
      </main>
    </div>
  )
}
