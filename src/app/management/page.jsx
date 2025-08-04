"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import styles from "./management.module.css"
import NaverMapSimple from "./navermap"
import LoadingOverlay from "../components/loadingoverlay"
import "../globals.css"

export default function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [summary, setSummary] = useState({
    building: 0,
    classroom: 0,
    user: 0,
  })
  const [userMarkers, setUserMarkers] = useState([])
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [ws, setWs] = useState(null)
  const [userId, setUserId] = useState("") // 로그인한 관리자 ID
  const [loading, setLoading] = useState(true) // 초기 로딩 상태

  // 항상 최신 userId를 기억하기 위한 useRef
  const userIdRef = useRef("")
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  // localStorage에서 userId 불러오기
  useEffect(() => {
    const storedId = localStorage.getItem("userId")
    if (storedId) {
      setUserId(storedId)
    } else {
      setUserId("admin") // fallback (로그인 세션 없을때)
    }
  }, [])

  // 건물, 강의실, 사용자 수 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildingRes, roomRes, userRes] = await Promise.all([
          fetch("/api/building-route?type=names"),
          fetch("/api/room-route"),
          fetch("/api/user-route"),
        ])

        const [buildingData, roomData, userData] = await Promise.all([
          buildingRes.json(),
          roomRes.json(),
          userRes.json(),
        ])

        setSummary({
          building: Array.isArray(buildingData.names)
            ? buildingData.names.length
            : 0,
          classroom: Array.isArray(roomData.rooms) ? roomData.rooms.length : 0,
          user: Array.isArray(userData.users) ? userData.users.length : 0,
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
        .catch((error) => {
          console.error("로그인 경로 데이터 조회 실패:", error)
        })
    }

    fetchMarkers()
    const intervalId = setInterval(fetchMarkers, 5000)
    return () => clearInterval(intervalId)
  }, [])

  // 웹소켓 등록: userId가 준비된 이후에 연결
  useEffect(() => {
    if (!userId) return

    let websocketInstance = null
    let reconnectTimeoutId = null
    let isConnecting = false

    const connectWebSocket = () => {
      if (isConnecting) return // 이미 연결 중이면 중복 연결 방지
      isConnecting = true

      try {
        const websocketUrl = "ws://16.176.179.75:3002/friend/ws"
        console.log("웹소켓 자동 연결 시도:", websocketUrl)

        const newWs = new WebSocket(websocketUrl)

        newWs.onopen = () => {
          isConnecting = false
          setIsWebSocketConnected(true)
          setWs(newWs)
          // 항상 최신 userIdRef.current를 전송
          console.log("ws register! userIdRef.current=", userIdRef.current)
          newWs.send(
            JSON.stringify({
              type: "register",
              userId: userIdRef.current,
              timestamp: new Date().toISOString(),
            })
          )
        }

        newWs.onclose = (event) => {
          isConnecting = false
          setIsWebSocketConnected(false)
          setWs(null)
          // 정상적인 종료가 아닐 때만 재연결
          if (event.code !== 1000) {
            reconnectTimeoutId = setTimeout(() => {
              if (!isWebSocketConnected) {
                connectWebSocket()
              }
            }, 3000)
          }
        }

        newWs.onerror = (error) => {
          isConnecting = false
          setIsWebSocketConnected(false)
        }

        newWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            switch (data.type) {
              case "registered":
                console.log("웹소켓 등록 성공:", data.message)
                break
              case "heartbeat_response":
                console.log("하트비트 응답 수신")
                break
              case "friend_logged_in":
                alert(`친구 로그인 알림: ${data.message}`)
                break
              case "online_users":
                break
              default:
                break
            }
          } catch (error) {
            console.error("메시지 파싱 오류:", error)
          }
        }

        websocketInstance = newWs
      } catch (error) {
        isConnecting = false
        console.error("웹소켓 연결 오류:", error)
      }
    }

    connectWebSocket()
    // 언마운트시 정리
    return () => {
      if (websocketInstance) {
        websocketInstance.close()
      }
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId)
    }
  }, [userId])

  // 하트비트 전송
  useEffect(() => {
    if (!ws || !isWebSocketConnected) return

    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          })
        )
      }
    }, 30000)

    return () => clearInterval(heartbeatInterval)
  }, [ws, isWebSocketConnected])

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
