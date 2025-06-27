// room-manage
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import "./room-manage.css"

export default function ClassroomManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 강의실 정보 불러오기
  const fetchClassrooms = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/classroom-route")
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "강의실 정보를 불러올 수 없습니다.")
      setClassrooms(Array.isArray(data.classrooms) ? data.classrooms : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassrooms()
  }, [])

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
              {classrooms.length === 0 ? (
                <tr>
                  <td colSpan={4}>강의실 데이터가 없습니다.</td>
                </tr>
              ) : (
                classrooms.map((room) => (
                  <tr key={room.id || room.room_id || room.name}>
                    <td>{room.building || room.Building_Name || ""}</td>
                    <td>{room.floor || room.Floor || ""}</td>
                    <td>{room.name || room.Room_Name || ""}</td>
                    <td>{room.description || room.desc || ""}</td>
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
