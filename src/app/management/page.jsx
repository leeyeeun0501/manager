// management (메인 화면)
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import styles from "./management.module.css" // css module로 변경

export default function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [summary, setSummary] = useState({
    building: 0,
    classroom: 0,
    user: 0,
  })

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

  return (
    <div className={styles["management-root"]}>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles["management-content"]}>
        <div className={styles["dashboard-summary-row"]}>
          <div className={styles["dashboard-summary-box"]}>
            <div className={styles["summary-label"]}>총 건물 수</div>
            <div className={styles["summary-value"]}>{summary.building}</div>
          </div>
          <div className={styles["dashboard-summary-box"]}>
            <div className={styles["summary-label"]}>총 강의실 수</div>
            <div className={styles["summary-value"]}>{summary.classroom}</div>
          </div>
          <div className={styles["dashboard-summary-box"]}>
            <div className={styles["summary-label"]}>등록 사용자</div>
            <div className={styles["summary-value"]}>{summary.user}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
