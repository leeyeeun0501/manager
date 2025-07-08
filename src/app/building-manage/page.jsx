"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import "./building-manage.css"
import { FaTrashAlt, FaPaperclip } from "react-icons/fa"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildingInfos, setBuildingInfos] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [floorPage, setFloorPage] = useState(1)
  const pageSize = 10

  // 층 추가 폼 상태
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [addFloorBuilding, setAddFloorBuilding] = useState("")
  const [addFloorNum, setAddFloorNum] = useState("")
  const [addFloorFile, setAddFloorFile] = useState(null)
  const [addFloorError, setAddFloorError] = useState("")
  const addFloorFileRef = useRef(null)
  const [floorNames, setFloorNames] = useState([])

  // 건물/층 옵션
  const buildingOptions = buildingInfos.map((b) => b.name)

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
          }))
        setBuildingInfos(infos)
      } catch (err) {
        setBuildingInfos([])
      }
    }
    fetchBuildings()
  }, [])

  // 건물 선택 시 해당 건물의 층수 목록만 fetch
  useEffect(() => {
    if (!selectedBuilding) {
      setFloorNames([])
      return
    }
    async function fetchFloorNames() {
      try {
        const res = await fetch(
          `/api/floor-route?building=${encodeURIComponent(
            selectedBuilding
          )}&type=names`
        )
        if (!res.ok) throw new Error("Failed to fetch floor names")
        const data = await res.json()
        setFloorNames(data.floors || [])
      } catch (err) {
        setFloorNames([])
      }
    }
    fetchFloorNames()
  }, [selectedBuilding])

  // floors fetch (전체/건물별)
  useEffect(() => {
    async function fetchFloors() {
      let url = "/api/floor-route"
      if (selectedBuilding) {
        url += `?building=${encodeURIComponent(selectedBuilding)}`
      }
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error("Failed to fetch floors")
        const data = await res.json()
        setFloors(data.floors || [])
      } catch (err) {
        setFloors([])
      }
    }
    fetchFloors()
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
      const res = await fetch("/api/floor-route", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAddFloorError(data.error || "층 추가 실패")
        return
      }
      alert("층 추가가 완료되었습니다!")
      setShowAddFloor(false)
      setAddFloorBuilding("")
      setAddFloorNum("")
      setAddFloorFile(null)
      if (addFloorFileRef.current) addFloorFileRef.current.value = ""
      // 데이터 새로고침
      if (selectedBuilding === addFloorBuilding) {
        const floorsRes = await fetch(
          `/api/floor-route?building=${encodeURIComponent(addFloorBuilding)}`
        )
        const floorsData = await floorsRes.json()
        setFloors(floorsData.floors || [])
      }
    } catch (err) {
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
      return // 층 추가 핸들러
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
        const res = await fetch("/api/floor-route", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setAddFloorError(data.error || "층 추가 실패")
          return
        }
        alert("층 추가가 완료되었습니다!")
        setShowAddFloor(false)
        setAddFloorBuilding("")
        setAddFloorNum("")
        setAddFloorFile(null)
        if (addFloorFileRef.current) addFloorFileRef.current.value = ""
        // 데이터 새로고침
        if (selectedBuilding === addFloorBuilding) {
          const floorsRes = await fetch(
            `/api/floor-route?building=${encodeURIComponent(addFloorBuilding)}`
          )
          const floorsData = await floorsRes.json()
          setFloors(floorsData.floors || [])
        }
      } catch (err) {
        setAddFloorError("층 추가 중 오류가 발생했습니다.")
      }
    }

    try {
      const res = await fetch(
        `/api/floor-route?building=${encodeURIComponent(
          buildingName
        )}&floor=${encodeURIComponent(floorNum)}`,
        { method: "DELETE" }
      )
      const text = await res.text()
      if (res.status === 200) {
        setFloors((prev) =>
          prev.filter(
            (f) =>
              !(
                String(f.building) === String(buildingName) &&
                String(f.floor) === String(floorNum)
              )
          )
        )
        alert(text)
      } else {
        alert(text)
      }
    } catch (err) {
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
        {/* 실제 입력란: 클릭 불가, 파일명 표시 */}
        <input
          type="text"
          readOnly
          value={fileName || ""}
          placeholder="SVG 파일"
          style={{
            width: "100%",
            height: "100%",
            padding: "0 44px 0 12px", // 오른쪽에 아이콘 공간 확보
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
        {/* 클립 아이콘 버튼: 입력란 오른쪽에 겹치게 */}
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
        {/* 숨겨진 실제 파일 인풋 */}
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
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        {/* 건물/층 선택 콤보박스: flex + gap으로 간격 부여 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 18,
            justifyContent: "space-between",
          }}
        >
          {/* 왼쪽: 콤보박스 2개 */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <select
              className="building-select"
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value)
                setSelectedFloor("")
                setFloorPage(1)
              }}
              style={{ minWidth: 150 }}
            >
              <option value="">건물 선택</option>
              {buildingOptions.map((b, idx) => (
                <option key={b || idx} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className="floor-select"
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
          {/* 오른쪽: 층 추가 버튼 */}
          <button
            className="add-floor-btn"
            onClick={() => setShowAddFloor(true)}
            type="button"
          >
            층 추가
          </button>
        </div>

        {/* 표: 사용자 관리 스타일 */}
        <div className="building-table-wrap">
          <table className="custom-table">
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
                    <td>
                      {row.file ? (
                        <span style={{ color: "#2574f5", fontWeight: 600 }}>
                          등록됨
                        </span>
                      ) : (
                        <span style={{ color: "#aaa" }}>없음</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
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
                    style={{ textAlign: "center", color: "#aaa" }}
                  >
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="building-pagination-row">
          <button
            className="building-pagination-btn"
            onClick={() => setFloorPage((p) => Math.max(1, p - 1))}
            disabled={floorPage === 1}
          >
            이전
          </button>
          <span className="building-pagination-info">
            {floorPage} / {floorTotalPages}
          </span>
          <button
            className="building-pagination-btn"
            onClick={() =>
              setFloorPage((p) => Math.min(floorTotalPages, p + 1))
            }
            disabled={floorPage === floorTotalPages}
          >
            다음
          </button>
        </div>

        {/* 층 추가 팝업: 첫 번째 이미지 스타일 + 파일 선택 아이콘 버튼 */}
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
                    color: addFloorBuilding ? "#222" : "#aaa",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    margin: "0 auto",
                    display: "block",
                    appearance: "none", // 크롬 기본 화살표 스타일 제거(선택)
                  }}
                >
                  <option value="">건물 선택</option>
                  {buildingOptions.map((b, idx) => (
                    <option key={b || idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={addFloorNum}
                  onChange={(e) => setAddFloorNum(e.target.value)}
                  placeholder="층수"
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
                  }}
                />
                {/* 파일 선택 아이콘 버튼 */}
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
                    onClick={() => setShowAddFloor(false)}
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
      </div>
    </div>
  )
}
