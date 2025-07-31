// management(메인 화면)
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
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [ws, setWs] = useState(null)
  const [userId, setUserId] = useState("") // 관리자 ID

  // 건물, 강의실, 사용자 수 초기 조회
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

  // 사용자 위치 주기적 갱신 (5초마다)
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

    fetchMarkers() // 최초 데이터 호출

    const intervalId = setInterval(fetchMarkers, 5000) // 5초마다 갱신

    return () => clearInterval(intervalId) // 언마운트 시 정리
  }, [])

  // 웹소켓 자동 연결 (컴포넌트 마운트 시)
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const websocketUrl = "ws://16.176.179.75:3002/friend/ws"
        console.log("웹소켓 자동 연결 시도:", websocketUrl)

        const newWs = new WebSocket(websocketUrl)

        newWs.onopen = () => {
          console.log("웹소켓 자동 연결 성공")
          setIsWebSocketConnected(true)
          setWs(newWs)

          // 서버에 등록 메시지 전송
          newWs.send(
            JSON.stringify({
              type: "register",
              userId: userId,
              timestamp: new Date().toISOString(),
            })
          )
        }

        newWs.onclose = (event) => {
          console.log("웹소켓 연결 해제됨:", event.code, event.reason)
          setIsWebSocketConnected(false)
          setWs(null)

          // 연결 해제 시 3초 후 재연결 시도
          setTimeout(() => {
            if (!isWebSocketConnected) {
              console.log("웹소켓 재연결 시도...")
              connectWebSocket()
            }
          }, 3000)
        }

        newWs.onerror = (error) => {
          console.error("웹소켓 연결 오류:", error)
          setIsWebSocketConnected(false)
        }

        newWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log("서버로부터 메시지 수신:", data)

            switch (data.type) {
              case "registered":
                console.log("웹소켓 등록 성공:", data.message)
                break

              case "heartbeat_response":
                console.log("하트비트 응답 수신")
                break

              case "friend_logged_in":
                console.log("친구 로그인 알림:", data.message)
                // 여기에 알림 표시 로직 추가
                alert(`친구 로그인 알림: ${data.message}`)
                break

              case "online_users":
                console.log("온라인 사용자 목록:", data.users)
                break

              default:
                console.log("알 수 없는 메시지 타입:", data.type)
            }
          } catch (error) {
            console.error("메시지 파싱 오류:", error)
          }
        }
      } catch (error) {
        console.error("웹소켓 연결 오류:", error)
      }
    }

    // 컴포넌트 마운트 시 자동 연결
    connectWebSocket()

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (ws) {
        ws.close()
        console.log("웹소켓 연결 해제됨")
      }
    }
  }, []) // 빈 의존성 배열로 마운트 시에만 실행

  // 하트비트 전송 (30초마다)
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
        console.log("하트비트 전송")
      }
    }, 30000)

    return () => clearInterval(heartbeatInterval)
  }, [ws, isWebSocketConnected])

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
