"use client"
import React, { useEffect, useRef, useState } from "react"
import Menu from "../components/menu"
import "./mapfile.css"

export default function MapfileManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [mapUrl, setMapUrl] = useState("") // 도면 이미지 URL
  const [popup, setPopup] = useState(null) // {x, y}
  const [categoryList, setCategoryList] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
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
      setCategoryList([])
      return
    }
    fetch(
      `/api/mapfile-manage?building=${encodeURIComponent(selectedBuilding)}`
    )
      .then((res) => res.json())
      .then((data) => setFloors(data.floors || []))
  }, [selectedBuilding])

  // 층 선택 시 도면 이미지와 카테고리 목록 불러오기
  useEffect(() => {
    if (!selectedBuilding || !selectedFloor) {
      setMapUrl("")
      setCategoryList([])
      return
    }
    fetch(
      `/api/mapfile-manage?building=${encodeURIComponent(
        selectedBuilding
      )}&floor=${encodeURIComponent(selectedFloor)}`
    )
      .then((res) => res.json())
      .then((data) => {
        setMapUrl(data.mapUrl || "")
        setCategoryList(data.categories || [])
      })
  }, [selectedBuilding, selectedFloor])

  // 이미지 클릭 시 좌표 얻기
  const handleImageClick = (e) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    setPopup({ x, y })
    setSelectedCategory("")
    setSubmitMsg("")
  }

  // 팝업창에서 카테고리 선택 후 서버로 전송
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitMsg("")
    if (!selectedCategory) {
      setSubmitMsg("카테고리를 선택하세요.")
      return
    }
    const res = await fetch("/api/mapfile-manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building: selectedBuilding,
        floor: selectedFloor,
        category: selectedCategory,
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
    <div className="mapfile-manage-root">
      {/* 햄버거 메뉴 */}
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <h2 className="mapfile-manage-title">2D 도면 카테고리 위치 관리</h2>
      <div className="mapfile-manage-controls">
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
      <div className="mapfile-map-area">
        {mapUrl ? (
          <img
            ref={imgRef}
            src={mapUrl}
            alt="도면"
            className="mapfile-map-image"
            onClick={handleImageClick}
          />
        ) : (
          <div className="mapfile-map-placeholder">
            도면 이미지를 선택하세요.
          </div>
        )}

        {/* 팝업: 좌표와 카테고리 선택 */}
        {popup && (
          <div
            className="mapfile-popup"
            style={{
              left: popup.x,
              top: popup.y,
            }}
          >
            <form onSubmit={handleSubmit}>
              <div>
                <b>좌표:</b> ({popup.x}, {popup.y})
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
                autoFocus
              >
                <option value="">카테고리 선택</option>
                {categoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button type="submit">저장</button>
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  style={{ background: "#bbb" }}
                >
                  취소
                </button>
              </div>
            </form>
            {submitMsg && (
              <div
                className={`mapfile-popup-msg ${
                  submitMsg === "저장 완료!" ? "success" : "error"
                }`}
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
