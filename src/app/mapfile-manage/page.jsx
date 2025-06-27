// mapfile-manage
"use client"
import React, { useRef, useState } from "react"
import Menu from "../components/menu"
import "./mapfile-manage.css"

export default function MapfileManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState("W1")
  const [selectedFloor, setSelectedFloor] = useState("1")
  const [imgUrl, setImgUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState(null)
  const [categoryList, setCategoryList] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [submitMsg, setSubmitMsg] = useState("")
  const imgRef = useRef(null)

  // 건물, 층 콤보박스 옵션
  const buildingOptions = Array.from({ length: 19 }, (_, i) => `W${i + 1}`)
  const floorOptions = ["1", "2"]

  // 서버에서 안 받고 여기서 목록 부름
  const categoryOptions = [
    "카페",
    "식당",
    "편의점",
    "자판기",
    "정수기",
    "프린터",
    "라운지",
    "은행(atm)",
    "열람실",
    "스터디룸",
  ]

  // 도면 불러오기
  const handleLoadMap = async () => {
    setImgUrl("")
    setCategoryList([])
    setPopup(null)
    setSubmitMsg("")
    setLoading(true)
    try {
      const res = await fetch(
        `/api/mapfile-image-route?floor=${encodeURIComponent(
          selectedFloor
        )}&building=${encodeURIComponent(selectedBuilding)}`
      )
      if (!res.ok) {
        setImgUrl("")
        setLoading(false)
        setSubmitMsg("도면 이미지를 불러올 수 없습니다.")
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setImgUrl(objectUrl)

      setCategoryList([])
    } catch (e) {
      setImgUrl("")
      setSubmitMsg("도면을 불러오는 중 오류가 발생했습니다.")
    }
    setLoading(false)
  }

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

    const res = await fetch("/api/mapfile-image-route", {
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
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <h2 className="mapfile-manage-title">2D 도면 카테고리 위치 관리</h2>
      <div className="mapfile-manage-controls">
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          style={{ width: 120, marginRight: 8 }}
        >
          {buildingOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          style={{ width: 80, marginRight: 8 }}
        >
          {floorOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button onClick={handleLoadMap}>도면 불러오기</button>
      </div>
      <div className="mapfile-map-area">
        {loading ? (
          <div className="mapfile-map-placeholder">로딩 중...</div>
        ) : imgUrl ? (
          <img
            ref={imgRef}
            src={imgUrl}
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
                {categoryOptions.map((cat) => (
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
