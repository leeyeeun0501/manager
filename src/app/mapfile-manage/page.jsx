"use client"
import React, { useEffect, useRef, useState } from "react"

export default function MapfileManagePage() {
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [mapUrl, setMapUrl] = useState("") // 도면 이미지 URL
  const [popup, setPopup] = useState(null) // {x, y}
  const [category, setCategory] = useState("")
  const [submitMsg, setSubmitMsg] = useState("")
  const imgRef = useRef(null)

  // 건물 목록 불러오기
  useEffect(() => {
    fetch("/api/mapfile-manage")
      .then((res) => res.json())
      .then((data) => setBuildings(data.buildings || []))
  }, [])

  // 건물 선택 시 층 목록 불러오기
  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([])
      setSelectedFloor("")
      setMapUrl("")
      return
    }
    fetch(
      `/api/mapfile-manage?building=${encodeURIComponent(selectedBuilding)}`
    )
      .then((res) => res.json())
      .then((data) => setFloors(data.floors || []))
  }, [selectedBuilding])

  // 층 선택 시 도면 이미지 불러오기
  useEffect(() => {
    if (!selectedBuilding || !selectedFloor) {
      setMapUrl("")
      return
    }
    fetch(
      `/api/mapfile-manage?building=${encodeURIComponent(
        selectedBuilding
      )}&floor=${encodeURIComponent(selectedFloor)}`
    )
      .then((res) => res.json())
      .then((data) => setMapUrl(data.mapUrl || ""))
  }, [selectedBuilding, selectedFloor])

  // 이미지 클릭 시 좌표 얻기
  const handleImageClick = (e) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    setPopup({ x, y })
    setCategory("")
    setSubmitMsg("")
  }

  // 팝업창에서 카테고리 입력 후 서버로 전송
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitMsg("")
    if (!category) {
      setSubmitMsg("카테고리 이름을 입력하세요.")
      return
    }
    const res = await fetch("/api/mapfile-manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building: selectedBuilding,
        floor: selectedFloor,
        category,
        x: popup.x,
        y: popup.y,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setSubmitMsg("저장 완료!")
      setPopup(null)
    } else {
      setSubmitMsg(data.error || "저장 실패")
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h2>2D 도면 카테고리 위치 관리</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
        >
          <option value="">건물 선택</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          disabled={!floors.length}
        >
          <option value="">층 선택</option>
          {floors.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          position: "relative",
          minHeight: 500,
          border: "1px solid #ddd",
          background: "#fafafa",
        }}
      >
        {mapUrl ? (
          <img
            ref={imgRef}
            src={mapUrl}
            alt="도면"
            style={{
              display: "block",
              maxWidth: "100%",
              margin: "0 auto",
              cursor: "crosshair",
            }}
            onClick={handleImageClick}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#aaa", paddingTop: 100 }}>
            도면 이미지를 선택하세요.
          </div>
        )}

        {/* 팝업: 좌표와 카테고리 입력 */}
        {popup && (
          <div
            style={{
              position: "absolute",
              left: popup.x,
              top: popup.y,
              background: "#fff",
              border: "1px solid #888",
              borderRadius: 6,
              padding: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 8 }}>
                <b>좌표:</b> ({popup.x}, {popup.y})
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="카테고리 이름"
                style={{ width: 140 }}
                autoFocus
              />
              <button type="submit" style={{ marginLeft: 8 }}>
                저장
              </button>
              <button
                type="button"
                style={{ marginLeft: 8 }}
                onClick={() => setPopup(null)}
              >
                취소
              </button>
            </form>
            {submitMsg && (
              <div
                style={{
                  color: submitMsg === "저장 완료!" ? "green" : "red",
                  marginTop: 6,
                }}
              >
                {submitMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
