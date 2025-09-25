// floor-manage
"use client"
import "../globals.css"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import styles from "./floor-manage.module.css"
import { FaTrashAlt, FaPaperclip } from "react-icons/fa"
import { apiGet, apiPost, apiPut, apiDelete, parseJsonResponse } from "../utils/apiHelper"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildingInfos, setBuildingInfos] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [floorPage, setFloorPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const pageSize = 10

  const [editMapBuilding, setEditMapBuilding] = useState("")
  const [editMapFloor, setEditMapFloor] = useState("")

  // 층 추가 폼 상태
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [addFloorBuilding, setAddFloorBuilding] = useState("")
  const [addFloorNum, setAddFloorNum] = useState("1")
  const [addFloorFile, setAddFloorFile] = useState(null)
  const [addFloorError, setAddFloorError] = useState("")
  const addFloorFileRef = useRef(null)

  // 건물 옵션
  const buildingOptions = buildingInfos.map((b) => b.name)

  const [editMapFile, setEditMapFile] = useState(null)
  const editMapFileRef = useRef(null)
  const [editMapError, setEditMapError] = useState("")
  const [editMapLoading, setEditMapLoading] = useState(false)

  const [hoveredKey, setHoveredKey] = useState("")
  const [addFile, setAddFile] = useState(null)
  const [addFileError, setAddFileError] = useState("")
  const [addFileLoading, setAddFileLoading] = useState(false)
  const addFileRef = useRef(null)

  // 모달
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [mapModalFile, setMapModalFile] = useState("")
  const [fileAddModal, setFileAddModal] = useState({
    open: false,
    building: "",
    floor: "",
  })

  const getCacheBustedUrl = (url) => {
    if (!url) return url
    const separator = url.includes("?") ? "&" : "?"
    return url + separator + "ts=" + Date.now()
  }

  // 층 표 필터 및 페이지네이션
  const floorFiltered = selectedFloor
    ? floors.filter((f) => String(f.floor) === String(selectedFloor))
    : floors

  const floorTotalPages = Math.max(
    1,
    Math.ceil((floorFiltered.length || 0) / pageSize)
  )

  const floorPaged = floorFiltered.slice(
    (floorPage - 1) * pageSize,
    floorPage * pageSize
  )

  const floorList = [
    "B5",
    "B4",
    "B3",
    "B2",
    "B1",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
  ]

  // 층 콤보박스 옵션
  const floorNames = Array.from(
    new Set(floors.map((f) => String(f.floor)).filter(Boolean))
  ).sort((a, b) => Number(a) - Number(b))

  const currentFloorIndex = floorList.indexOf(addFloorNum)

  const handleFloorUp = () => {
    if (currentFloorIndex < floorList.length - 1) {
      setAddFloorNum(floorList[currentFloorIndex + 1])
    }
  }

  const handleFloorDown = () => {
    if (currentFloorIndex > 0) {
      setAddFloorNum(floorList[currentFloorIndex - 1])
    }
  }

  // 층 정보 fetch 함수 분리
  async function fetchFloors(buildingName = selectedBuilding) {
    let url = "/api/floor-route"
    if (buildingName) {
      url += `?building=${encodeURIComponent(buildingName)}`
    }
    try {
      const res = await apiGet(url)
      const data = await parseJsonResponse(res)
      setFloors(data.floors || [])
    } catch (err) {
      setFloors([])
    }
    setSelectedFloor("")
  }

  // 건물 목록 로드
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await apiGet("/api/building-route")
        const data = await parseJsonResponse(res)
        const infos = (data.all || [])
          .filter((b) => b && b.Building_Name)
          .map((b) => ({
            name: b.Building_Name,
          }))
        setBuildingInfos(infos)
      } catch (err) {
        setBuildingInfos([])
      } finally {
        setLoading(false)
      }
    }
    fetchBuildings()
  }, [])

  // 선택된 건물이 바뀔 때 층 정보 로드
  useEffect(() => {
    fetchFloors(selectedBuilding)
  }, [selectedBuilding])

  // 층 추가 핸들러
  const handleAddFloor = async (e) => {
    e.preventDefault()
    setAddFloorError("")
    if (!addFloorBuilding || !addFloorNum || !addFloorFile) {
      setAddFloorError("모든 항목을 입력하세요.")
      return
    }
    const formData = new FormData()
    formData.append("building_name", addFloorBuilding)
    formData.append("floor_number", addFloorNum)
    formData.append("file", addFloorFile)
    try {
      console.log("🏢 층 추가 시작:", { building: addFloorBuilding, floor: addFloorNum, file: addFloorFile?.name })
      
      const res = await apiPost("/api/floor-route", formData)
      console.log("🏢 층 추가 응답 상태:", res.status)
      console.log("🏢 층 추가 응답 헤더:", Object.fromEntries(res.headers.entries()))
      
      const data = await parseJsonResponse(res)
      console.log("🏢 층 추가 응답 데이터:", data)
      
      if (data && !data.error) {
        console.log("✅ 층 추가 성공")
        alert("층 추가가 완료되었습니다!")
        setShowAddFloor(false)
        setAddFloorBuilding("")
        setAddFloorNum("1")
        setAddFloorFile(null)
        if (addFloorFileRef.current) addFloorFileRef.current.value = ""

        // '전체 건물' 또는 특정 건물 상태에 따라 갱신
        await fetchFloors(selectedBuilding)
      } else {
        console.log("❌ 층 추가 실패:", data.error)
        setAddFloorError(data.error || "층 추가 실패")
      }
    } catch (err) {
      console.error("❌ 층 추가 오류:", err)
      console.error("❌ 오류 스택:", err.stack)
      setAddFloorError("층 추가 중 오류가 발생했습니다.")
    }
  }

  // 층 삭제 핸들러
  const handleDeleteFloor = async (buildingName, floorNum) => {
    if (
      !window.confirm(
        `정말로 ${buildingName}의 ${floorNum}층을 삭제하시겠습니까?`
      )
    )
      return

    try {
      console.log("🗑️ 층 삭제 시작:", { building: buildingName, floor: floorNum })
      
      const res = await apiDelete(
        `/api/floor-route?building=${encodeURIComponent(
          buildingName
        )}&floor=${encodeURIComponent(floorNum)}`
      )
      console.log("🗑️ 층 삭제 응답 상태:", res.status)
      
      const data = await parseJsonResponse(res)
      console.log("🗑️ 층 삭제 응답 데이터:", data)
      
      if (data && data.success) {
        console.log("✅ 층 삭제 성공")
        setFloors((prev) =>
          prev.filter(
            (f) =>
              !(
                String(f.building) === String(buildingName) &&
                String(f.floor) === String(floorNum)
              )
          )
        )
        alert("층 삭제가 완료되었습니다.")
      } else {
        console.log("❌ 층 삭제 실패:", data.error)
        alert(data.error || "층 삭제 실패")
      }
    } catch (err) {
      console.error("❌ 층 삭제 오류:", err)
      alert("층 삭제 중 오류가 발생했습니다.")
    }
  }

  // 파일 선택 아이콘 버튼 컴포넌트
  function ClipFileInput({ onFileChange, fileName }) {
    const fileInputRef = useRef(null)
    return (
      <div
        style={{
          width: "100%",
          height: 48,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          readOnly
          value={fileName || ""}
          placeholder="SVG 파일"
          style={{
            width: "100%",
            height: "100%",
            padding: "0 44px 0 12px",
            border: "none",
            outline: "none",
            borderRadius: 14,
            fontSize: 16,
            background: "transparent",
            color: fileName ? "#222" : "#aaa",
            fontFamily: "inherit",
            boxSizing: "border-box",
            cursor: "pointer",
          }}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            position: "absolute",
            top: "50%",
            right: 10,
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            color: "#2574f5",
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="SVG 파일 업로드"
        >
          <FaPaperclip size={22} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
      </div>
    )
  }

  return (
    <div className={styles["building-root"]}>
      {loading && <LoadingOverlay />}
      <span className={styles["building-header"]}>층 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles["building-content"]}>
        {/* 건물/층 선택 콤보박스 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 18,
            justifyContent: "space-between",
          }}
        >
          {/* 건물/층 콤보 박스 */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <select
              className={styles["building-select"]}
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value)
                setSelectedFloor("")
                setFloorPage(1)
              }}
              style={{ minWidth: 150 }}
            >
              <option value="">전체 건물</option>
              {buildingOptions.map((b, idx) => (
                <option key={b || idx} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className={styles["floor-select"]}
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value)
                setFloorPage(1)
              }}
              disabled={!selectedBuilding}
              style={{ minWidth: 120 }}
            >
              <option value="">전체 층</option>
              {floorNames.length > 0 ? (
                floorNames.map((f, idx) => (
                  <option key={f || idx} value={f}>
                    {f}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  없음
                </option>
              )}
            </select>
          </div>

          {/* 층 추가 버튼 */}
          <button
            className={styles["add-floor-btn"]}
            onClick={() => {
              setShowAddFloor(true)
              if (selectedBuilding) {
                setAddFloorBuilding(selectedBuilding)
              } else {
                setAddFloorBuilding("")
              }
            }}
            type="button"
          >
            층 추가
          </button>
        </div>

        {/* 표 */}
        <div className={styles["building-table-wrap"]}>
          <table
            className={`${styles["custom-table"]} ${styles["bordered-table"]}`}
          >
            <thead>
              <tr>
                <th>건물명</th>
                <th>층</th>
                <th>맵 파일</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {floorPaged.length > 0 ? (
                floorPaged.map((row, idx) => (
                  <tr key={row.building + "-" + row.floor + "-" + idx}>
                    <td>{row.building}</td>
                    <td>{row.floor}</td>
                    <td
                      style={{ position: "relative" }}
                      onMouseEnter={() =>
                        setHoveredKey(`${row.building}-${row.floor}`)
                      }
                      onMouseLeave={() => setHoveredKey("")}
                    >
                      {row.file ? (
                        <button
                          type="button"
                          style={{
                            color: "#2574f5",
                            fontWeight: 600,
                            textDecoration: "underline",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setMapModalFile(row.file)
                            setMapModalOpen(true)
                            setEditMapBuilding(row.building)
                            setEditMapFloor(row.floor)
                            setEditMapFile(null)
                            setEditMapError("")
                          }}
                        >
                          2D 도면 미리보기
                        </button>
                      ) : (
                        <>
                          <span style={{ color: "#aaa" }}>없음</span>
                          {hoveredKey === `${row.building}-${row.floor}` && (
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#2574f5",
                                fontSize: 18,
                                marginLeft: 6,
                                padding: 0,
                                verticalAlign: "middle",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              aria-label="맵 파일 추가"
                              onClick={() => {
                                setFileAddModal({
                                  open: true,
                                  building: row.building,
                                  floor: row.floor,
                                })
                                setAddFile(null)
                                setAddFileError("")
                                if (addFileRef.current)
                                  addFileRef.current.value = ""
                              }}
                            >
                              <FaPaperclip size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <button
                        className={styles["delete-btn"]}
                        onClick={() =>
                          handleDeleteFloor(row.building, row.floor)
                        }
                        title="삭제"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                        }}
                      >
                        <FaTrashAlt size={18} color="#e74c3c" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      color: "#666",
                      fontSize: "16px",
                      fontWeight: "500",
                    }}
                  >
                    {selectedBuilding && selectedFloor
                      ? `${selectedBuilding} ${selectedFloor}층 데이터가 없습니다`
                      : selectedBuilding
                      ? `${selectedBuilding} 건물의 층 데이터가 없습니다`
                      : "데이터가 없습니다"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className={styles["building-pagination-row"]}>
          <button
            className={styles["building-pagination-btn"]}
            onClick={() => setFloorPage((p) => Math.max(1, p - 1))}
            disabled={floorPage === 1}
          >
            이전
          </button>
          <span className={styles["building-pagination-info"]}>
            {floorPage} / {floorTotalPages}
          </span>
          <button
            className={styles["building-pagination-btn"]}
            onClick={() =>
              setFloorPage((p) => Math.min(floorTotalPages, p + 1))
            }
            disabled={floorPage === floorTotalPages}
          >
            다음
          </button>
        </div>

        {/* 층 추가 팝업 */}
        {showAddFloor && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.14)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowAddFloor(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                minWidth: 380,
                maxWidth: "95vw",
                padding: "36px 32px 28px 32px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#1976d2",
                  marginBottom: 18,
                  textAlign: "center",
                  borderBottom: "2px solid #1976d2",
                  paddingBottom: 6,
                  letterSpacing: "-0.5px",
                }}
              >
                층 추가
              </div>
              <form
                onSubmit={handleAddFloor}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <select
                  value={addFloorBuilding}
                  onChange={(e) => setAddFloorBuilding(e.target.value)}
                  required
                  style={{
                    width: "90%",
                    height: 48,
                    padding: "0 12px",
                    borderRadius: 14,
                    border: "1.5px solid #b3d1fa",
                    fontSize: 16,
                    background: "#fff",
                    color: "#222",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    margin: "0 auto",
                    display: "block",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">건물 선택</option>
                  {buildingOptions.map((b, idx) => (
                    <option key={b || idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {/* 층 선택: 화살표 방식 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "90%",
                    margin: "0 auto",
                    border: "1.5px solid #b3d1fa",
                    borderRadius: 14,
                    height: 48,
                    background: "#fff",
                    padding: "0 8px",
                    boxSizing: "border-box",
                    justifyContent: "space-between",
                  }}
                >
                  <input
                    type="text"
                    value={addFloorNum}
                    readOnly
                    required
                    style={{
                      flex: 1,
                      textAlign: "left",
                      fontSize: 16,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "#222",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleFloorUp}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 18,
                        cursor: "pointer",
                        color: "#2574f5",
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={handleFloorDown}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 18,
                        cursor: "pointer",
                        color: "#2574f5",
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    width: "90%",
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: 14,
                    border: "1.5px solid #b3d1fa",
                    height: 48,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  <ClipFileInput
                    onFileChange={(e) => setAddFloorFile(e.target.files[0])}
                    fileName={addFloorFile ? addFloorFile.name : ""}
                  />
                </div>
                {addFloorError && (
                  <div
                    style={{ color: "#e74c3c", fontSize: 15, margin: "4px 0" }}
                  >
                    {addFloorError}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#eee",
                      color: "#333",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setShowAddFloor(false)
                      setAddFloorBuilding("")
                      setAddFloorNum("1")
                      setAddFloorFile(null)
                      setAddFloorError("")
                      if (addFloorFileRef.current)
                        addFloorFileRef.current.value = ""
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#2574f5",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2D 도면 팝업 */}
        {mapModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.18)",
              zIndex: 20000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              setMapModalOpen(false)
              setEditMapFile(null)
              setEditMapError("")
              if (editMapFileRef.current) editMapFileRef.current.value = ""
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                minWidth: 600,
                maxWidth: "90vw",
                maxHeight: "90vh",
                padding: "28px 28px 18px 28px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                style={{
                  position: "absolute",
                  top: 12,
                  right: 18,
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#aaa",
                }}
                onClick={() => setMapModalOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
              <div
                style={{
                  marginBottom: 18,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#2574f5",
                }}
              >
                2D 도면 미리보기
              </div>
              <div
                style={{ marginBottom: 12, fontWeight: "bold", fontSize: 16 }}
              >
                {/* 건물명/층수 표시 */}
                <div
                  style={{
                    width: "100%",
                    fontSize: 16,
                    color: "#2574f5",
                    fontWeight: 600,
                    marginBottom: 12,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  건물명: {editMapBuilding} / 층수: {editMapFloor}
                </div>
              </div>
              {/* 도면 이미지 */}
              <object
                type="image/svg+xml"
                data={getCacheBustedUrl(mapModalFile)}
                style={{
                  width: "400px",
                  height: "400px",
                  maxWidth: "40vw",
                  maxHeight: "60vh",
                  border: "none",
                  borderRadius: 10,
                  background: "#f7f9fc",
                  display: "block",
                  margin: "0 auto",
                }}
              >
                SVG 미리보기를 지원하지 않는 브라우저입니다.
              </object>
              {/* 파일 선택 + 수정 버튼을 이미지 아래에 세로로 */}
              <form
                style={{
                  marginTop: 24,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  maxWidth: 340,
                }}
                onSubmit={async (e) => {
                  e.preventDefault()
                  setEditMapError("")
                  if (!editMapFile) {
                    setEditMapError("SVG 파일을 선택하세요.")
                    return
                  }
                  if (!editMapBuilding || !editMapFloor) {
                    setEditMapError("건물명과 층수를 선택하세요.")
                    return
                  }
                  setEditMapLoading(true)
                  try {
                    const formData = new FormData()
                    formData.append("file", editMapFile)
                    formData.append("building_name", editMapBuilding)
                    formData.append("floor_number", editMapFloor)

                    const res = await apiPut(
                      `/api/floor-route?building=${encodeURIComponent(
                        editMapBuilding
                      )}&floor=${encodeURIComponent(editMapFloor)}`,
                      formData
                    )
                    const data = await parseJsonResponse(res)
                    
                    if (data && !data.error) {
                      alert("도면이 성공적으로 수정되었습니다!")
                      await fetchFloors(selectedBuilding)
                    } else {
                      setEditMapError(data.error || "도면 수정 실패")
                      setEditMapLoading(false)
                      return
                    }

                    setMapModalOpen(false)
                  } catch (err) {
                    setEditMapError("도면 수정 중 오류가 발생했습니다.")
                  }
                  setEditMapLoading(false)
                }}
              >
                <div
                  style={{
                    width: "100%",
                    background: "#fff",
                    borderRadius: 14,
                    border: "1.5px solid #b3d1fa",
                    height: 48,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  <ClipFileInput
                    onFileChange={(e) => setEditMapFile(e.target.files[0])}
                    fileName={editMapFile ? editMapFile.name : ""}
                    accept=".svg"
                    fileInputRef={editMapFileRef}
                  />
                </div>
                {editMapError && (
                  <div style={{ color: "#e74c3c", fontSize: 15 }}>
                    {editMapError}
                  </div>
                )}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 14,
                    border: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    background: "#2574f5",
                    color: "#fff",
                    cursor: "pointer",
                    marginTop: 8,
                    opacity: editMapLoading ? 0.6 : 1,
                  }}
                  disabled={editMapLoading}
                >
                  {editMapLoading ? "수정 중..." : "도면 파일 수정"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2D 도면 추가 팝업 */}
        {fileAddModal.open && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.14)",
              zIndex: 20000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() =>
              setFileAddModal({ open: false, building: "", floor: "" })
            }
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                minWidth: 380,
                maxWidth: "95vw",
                padding: "36px 32px 28px 32px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#1976d2",
                  marginBottom: 18,
                  textAlign: "center",
                  borderBottom: "2px solid #1976d2",
                  paddingBottom: 6,
                  letterSpacing: "-0.5px",
                }}
              >
                2D 도면 파일 추가
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setAddFileError("")
                  if (!addFile) {
                    setAddFileError("SVG 파일을 선택하세요.")
                    return
                  }
                  if (!editMapBuilding || !editMapFloor) {
                    setEditMapError("건물명과 층수를 선택하세요.")
                    return
                  }
                  setAddFileLoading(true)
                  try {
                    const formData = new FormData()
                    formData.append("file", addFile)
                    formData.append("building_name", fileAddModal.building)
                    formData.append("floor_number", fileAddModal.floor)
                    const res = await apiPut(
                      `/api/floor-route?building=${encodeURIComponent(
                        fileAddModal.building
                      )}&floor=${encodeURIComponent(fileAddModal.floor)}`,
                      formData
                    )
                    const data = await parseJsonResponse(res)
                    
                    if (data && !data.error) {
                      alert("도면이 성공적으로 추가되었습니다!")
                      setFileAddModal({ open: false, building: "", floor: "" })
                      await fetchFloors(fileAddModal.building)
                    } else {
                      setAddFileError(data.error || "도면 추가 실패")
                      setAddFileLoading(false)
                      return
                    }
                  } catch (err) {
                    setAddFileError("도면 추가 중 오류가 발생했습니다.")
                  }
                  setAddFileLoading(false)
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* 건물명/층수 표시 */}
                <div
                  style={{
                    width: "90%",
                    margin: "0 auto",
                    fontSize: 16,
                    color: "#2574f5",
                    fontWeight: 600,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  {" "}
                  건물명: {fileAddModal.building} / 층수: {fileAddModal.floor}
                </div>
                {/* 파일 선택 */}
                <div
                  style={{
                    width: "90%",
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: 14,
                    border: "1.5px solid #b3d1fa",
                    height: 48,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  <ClipFileInput
                    onFileChange={(e) => setAddFile(e.target.files[0])}
                    fileName={addFile ? addFile.name : ""}
                  />
                </div>
                {addFileError && (
                  <div
                    style={{ color: "#e74c3c", fontSize: 15, margin: "4px 0" }}
                  >
                    {addFileError}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#eee",
                      color: "#333",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setFileAddModal({ open: false, building: "", floor: "" })
                    }
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 24,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      background: "#2574f5",
                      color: "#fff",
                      cursor: "pointer",
                      opacity: addFileLoading ? 0.6 : 1,
                    }}
                    disabled={addFileLoading}
                  >
                    {addFileLoading ? "업로드 중..." : "저장"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
