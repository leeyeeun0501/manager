// management
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import styles from "./management.module.css"
import NaverMapSimple from "./navermap"
import LoadingOverlay from "../components/loadingoverlay"
import "../globals.css"
import { apiGet, parseJsonResponse } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"

export default function ManagementPage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [summary, setSummary] = useState({
    building: 0,
    classroom: 0,
    user: 0,
  })
  const [userMarkers, setUserMarkers] = useState([])
  const [loading, setLoading] = useState(true)

  // 건물, 강의실, 사용자 수 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildingRes, roomRes, userRes] = await Promise.all([
          apiGet("/api/building-route?type=names"),
          apiGet("/api/room-route"),
          apiGet("/api/user-route"),
        ])

        const [buildingData, roomData, userData] = await Promise.all([
          parseJsonResponse(buildingRes),
          parseJsonResponse(roomRes),
          parseJsonResponse(userRes),
        ])

        // data.data 구조 처리 - 우선순위: data.data > data > 직접 접근
        let buildingNames = []
        if (buildingData.data?.data?.names && Array.isArray(buildingData.data.data.names)) {
          buildingNames = buildingData.data.data.names
        } else if (buildingData.data?.names && Array.isArray(buildingData.data.names)) {
          buildingNames = buildingData.data.names
        } else if (buildingData.names && Array.isArray(buildingData.names)) {
          buildingNames = buildingData.names
        }
        
        let roomRooms = []
        if (roomData.data?.data?.rooms && Array.isArray(roomData.data.data.rooms)) {
          roomRooms = roomData.data.data.rooms
        } else if (roomData.data?.rooms && Array.isArray(roomData.data.rooms)) {
          roomRooms = roomData.data.rooms
        } else if (roomData.rooms && Array.isArray(roomData.rooms)) {
          roomRooms = roomData.rooms
        }
        
        let userUsers = []
        if (userData.data?.data?.users && Array.isArray(userData.data.data.users)) {
          userUsers = userData.data.data.users
        } else if (userData.data?.users && Array.isArray(userData.data.users)) {
          userUsers = userData.data.users
        } else if (userData.users && userData.users.data && Array.isArray(userData.users.data)) {
          userUsers = userData.users.data
        } else if (userData.users && Array.isArray(userData.users)) {
          userUsers = userData.users
        }

        setSummary({
          building: Array.isArray(buildingNames) ? buildingNames.length : 0,
          classroom: Array.isArray(roomRooms) ? roomRooms.length : 0,
          user: Array.isArray(userUsers) ? userUsers.length : 0,
        })
      } catch (error) {
        console.error("데이터 로딩 오류:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 사용자 위치 정보(마커) 주기적 갱신
  useEffect(() => {
    const fetchMarkers = () => {
      apiGet("/api/login-route")
        .then(parseJsonResponse)
        .then((data) => {
          // data.data 구조로 변경 - 우선순위: data.data > data > 직접 접근
          let userData = []
          if (data.data?.data && Array.isArray(data.data.data)) {
            userData = data.data.data
          } else if (data.data && Array.isArray(data.data)) {
            userData = data.data
          } else if (Array.isArray(data)) {
            userData = data
          }
          
          if (Array.isArray(userData)) {
            const markers = userData
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
        .catch((error) => {
          // 에러가 발생해도 페이지는 유지하고 빈 배열로 설정
          setUserMarkers([])
        })
    }

    fetchMarkers()
    const intervalId = setInterval(fetchMarkers, 5000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className={styles["management-root"]}>
      {loading && <LoadingOverlay />}
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
        <NaverMapSimple markers={userMarkers} />
      </main>
    </div>
  )
}
