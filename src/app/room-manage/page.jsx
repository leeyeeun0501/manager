// room-manage
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import "./room-manage.css"

export default function RoomManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 강의실 추가 폼 상태
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    building: "",
    floor: "",
    room_name: "",
    room_desc: "",
    x: "",
    y: "",
  })
  const [addError, setAddError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  // 강의실 정보 불러오기
  const fetchRooms = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/room-route")
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "강의실 정보를 불러올 수 없습니다.")
      setRooms(Array.isArray(data.rooms) ? data.rooms : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  // 강의실 추가 핸들러
  const handleAddRoom = async (e) => {
    e.preventDefault()
    setAddError("")
    setAddLoading(true)
    try {
      const res = await fetch(
        `/api/room-route/${encodeURIComponent(
          form.building
        )}/${encodeURIComponent(form.floor)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name: form.room_name,
            room_desc: form.room_desc,
            x: form.x,
            y: form.y,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || "방 추가 실패")
      } else {
        alert(data.message || "방 추가가 완료되었습니다")
        setShowAdd(false)
        setForm({
          building: "",
          floor: "",
          room_name: "",
          room_desc: "",
          x: "",
          y: "",
        })
        fetchRooms()
      }
    } catch (err) {
      setAddError("서버 오류가 발생했습니다.")
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="management-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="management-content">
        <h1>강의실 관리</h1>
        {loading && <p>로딩 중...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && (
          <table className="user-table center-table">
            <thead>
              <tr>
                <th>건물명</th>
                <th>층</th>
                <th>강의실명</th>
                <th>강의실 설명</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={4}>강의실 데이터가 없습니다.</td>
                </tr>
              ) : (
                rooms.map((room, idx) => (
                  <tr key={room.name + room.floor + room.building + idx}>
                    <td>{room.building}</td>
                    <td>{room.floor}</td>
                    <td>{room.name}</td>
                    <td>{room.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
