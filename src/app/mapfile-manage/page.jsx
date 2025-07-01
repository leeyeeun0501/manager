// mapfile-manage
"use client"
import React, { useRef, useState, useEffect } from "react"
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
  const canvasRef = useRef(null)

  // 건물, 층 콤보박스 옵션

  const [floors, setFloors] = useState([])
  const [floorPage, setFloorPage] = useState(1)
  const [buildingInfos, setBuildingInfos] = useState([])
  const [buildingPage, setBuildingPage] = useState(1)

  const [deleteTarget, setDeleteTarget] = useState(null) // 삭제할 카테고리 정보
  const [showDeletePopup, setShowDeletePopup] = useState(false)

  // 건물 목록 fetch
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch buildings")
        const data = await res.json()
        const infos = (data.all || [])
          .filter((b) => b && b.Building_Name)
          .map((b) => ({
            name: b.Building_Name,
            desc: b.Description || "",
            file: b.File || null,
          }))
        setBuildingInfos(infos)
      } catch (err) {
        setBuildingInfos([])
      }
    }
    fetchBuildings()
  }, [])

  // 건물 선택 시 해당 건물의 층 fetch
  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([])
      setSelectedFloor("")
      setFloorPage(1)
      return
    }
    async function fetchFloors() {
      try {
        const res = await fetch(
          `/api/floor-route?building=${encodeURIComponent(selectedBuilding)}`
        )
        if (!res.ok) throw new Error("Failed to fetch floors")
        const data = await res.json()
        setFloors(Array.isArray(data.floors) ? data.floors : [])
        setSelectedFloor("")
        setFloorPage(1)
      } catch (err) {
        setFloors([])
        setSelectedFloor("")
        setFloorPage(1)
      }
    }
    fetchFloors()
  }, [selectedBuilding])

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

      // 2. 카테고리 위치 fetch
      const catRes = await fetch(
        `/api/category-route?building=${encodeURIComponent(
          selectedBuilding
        )}&floor=${encodeURIComponent(selectedFloor)}`
      )
      if (!catRes.ok) {
        setCategoryList([])
        setSubmitMsg("카테고리 위치를 불러올 수 없습니다.")
      } else {
        const catData = await catRes.json()
        setCategoryList(Array.isArray(catData) ? catData : [])
      }
    } catch (e) {
      setImgUrl("")
      setCategoryList([])
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

  const handleImageLoad = () => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    // 1. 실제 렌더링 크기 기준으로 맞추기 (이미지에 width: 100% 등 스타일 적용 시)
    canvas.width = img.clientWidth
    canvas.height = img.clientHeight

    // 2. 원본 이미지 크기 기준으로 맞추고 싶다면
    // canvas.width = img.naturalWidth
    // canvas.height = img.naturalHeight

    // 필요하다면 여기서 캔버스에 그림 그리기 등 추가 작업 가능
  }

  return (
    <div className="layout">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="mapfile-manage-root">
        <h2 className="mapfile-manage-title">2D 도면 카테고리 위치 관리</h2>
        <div className="mapfile-manage-controls">
          <select
            className="building-select"
            value={selectedBuilding}
            onChange={(e) => {
              setSelectedBuilding(e.target.value)
              setBuildingPage(1)
              setFloorPage(1)
            }}
          >
            <option value="">건물</option>
            {buildingInfos.map((b, idx) => (
              <option key={b.name || idx} value={b.name}>
                {b.name}
              </option>
            ))}{" "}
          </select>
          <select
            className="floor-select"
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(e.target.value)
              setFloorPage(1)
            }}
            disabled={!selectedBuilding}
          >
            <option value="">전체</option>
            {floors.map((f, idx) => (
              <option key={f.floor || idx} value={f.floor}>
                {f.floor}
              </option>
            ))}{" "}
          </select>
          <button onClick={handleLoadMap}>도면 불러오기</button>
        </div>
        <div
          className="mapfile-map-area"
          style={{ position: "relative", display: "inline-block" }}
        >
          {loading ? (
            <div className="mapfile-map-placeholder">로딩 중...</div>
          ) : imgUrl ? (
            <>
              <img
                ref={imgRef}
                src={imgUrl}
                alt="도면"
                className="mapfile-map-image"
                onClick={handleImageClick}
                onLoad={handleImageLoad} // 이미지 로드 시 크기 동기화
                style={{ display: "block" }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            </>
          ) : (
            <div className="mapfile-map-placeholder">
              도면 이미지를 선택하세요.
            </div>
          )}
          {/* 카테고리 위치 도형(원) 표시 */}
          {categoryList.map((cat, idx) =>
            cat.Category_Location ? (
              <div
                key={cat.Category_Name + idx}
                className="category-marker"
                style={{
                  position: "absolute",
                  left: cat.Category_Location.x,
                  top: cat.Category_Location.y,
                  width: 36,
                  height: 36,
                  background: "#3b82f6",
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  border: "2px solid #fff",
                  zIndex: 5,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto", // 클릭 가능하게
                  cursor: "pointer",
                }}
                title={cat.Category_Name}
                onClick={() => {
                  setDeleteTarget(cat)
                  setShowDeletePopup(true)
                }}
              >
                {cat.Category_Name[0]}
              </div>
            ) : null
          )}

          {/* --- 기존 팝업 로직은 그대로 --- */}
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
                  className="category-select"
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

          {showDeletePopup && deleteTarget && (
            <div
              className="modal-overlay"
              onClick={() => {
                setShowDeletePopup(false)
                setDeleteTarget(null)
              }}
            >
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div style={{ marginBottom: 16 }}>
                  <b>{deleteTarget.Category_Name}</b> 위치를
                  <br />
                  정말 삭제하시겠습니까?
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <button
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "7px 18px",
                      fontWeight: "bold",
                    }}
                    onClick={async () => {
                      setShowDeletePopup(false)
                      setDeleteTarget(null)
                      const res = await fetch(
                        `/api/category-route?building=${encodeURIComponent(
                          selectedBuilding
                        )}&floor=${encodeURIComponent(selectedFloor)}`,
                        {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            x: deleteTarget.Category_Location.x,
                            y: deleteTarget.Category_Location.y,
                          }),
                        }
                      )
                      if (res.ok) {
                        setCategoryList((prev) =>
                          prev.filter(
                            (cat) =>
                              !(
                                cat.Category_Name ===
                                  deleteTarget.Category_Name &&
                                cat.Category_Location.x ===
                                  deleteTarget.Category_Location.x &&
                                cat.Category_Location.y ===
                                  deleteTarget.Category_Location.y
                              )
                          )
                        )
                      } else {
                        alert("삭제 실패")
                      }
                    }}
                  >
                    삭제
                  </button>
                  <button
                    style={{
                      background: "#bbb",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "7px 18px",
                      fontWeight: "bold",
                    }}
                    onClick={() => {
                      setShowDeletePopup(false)
                      setDeleteTarget(null)
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
