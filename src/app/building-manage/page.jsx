// building-manage
"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import "./building-manage.css"
import { FaTrashAlt } from "react-icons/fa"

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

  // 이미지 팝업 및 수정 상태 (층 맵 파일만)
  const [popupImg, setPopupImg] = useState(null)
  const [popupFloor, setPopupFloor] = useState(null)
  const [popupBuilding, setPopupBuilding] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const [editError, setEditError] = useState("")
  const editFileRef = useRef(null)

  // 건물/층 옵션
  const buildingOptions = buildingInfos.map((b) => b.name)
  const floorOptions = Array.from(
    new Set(floors.map((f) => String(f.floor)))
  ).sort((a, b) => Number(a) - Number(b))

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

  // 층 맵 파일 수정 핸들러
  const handleEditFloorMap = async () => {
    setEditError("")
    if (!popupBuilding || !popupFloor || !editFile) {
      setEditError("파일을 선택하세요.")
      return
    }
    const formData = new FormData()
    formData.append("file", editFile)
    try {
      const res = await fetch(
        `/api/floor-route?building=${encodeURIComponent(
          popupBuilding
        )}&floor=${encodeURIComponent(popupFloor)}`,
        {
          method: "PUT",
          body: formData,
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEditError(data.error || "맵 파일 수정 실패")
        return
      }
      // 새로고침
      if (selectedBuilding === popupBuilding) {
        const floorsRes = await fetch(
          `/api/floor-route?building=${encodeURIComponent(
            popupBuilding
          )}&_=${Date.now()}`
        )
        const floorsData = await floorsRes.json()
        setFloors(floorsData.floors || [])
      }
      alert("맵 파일이 수정되었습니다!")
      setPopupImg(null)
      setEditFile(null)
      setEditError("")
      if (editFileRef.current) editFileRef.current.value = ""
      setPopupFloor(null)
      setPopupBuilding(null)
    } catch (err) {
      setEditError("맵 파일 수정 중 오류가 발생했습니다.")
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

  return (
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        {/* 필터 */}
        <div className="building-filter-row">
          <select
            className="building-select"
            value={selectedBuilding}
            onChange={(e) => {
              setSelectedBuilding(e.target.value)
              setFloorPage(1)
            }}
          >
            <option value="">건물</option>
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
          >
            <option value="">전체</option>
            {floorOptions.length > 0 ? (
              floorOptions.map((f, idx) => (
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

        <div className="table-row">
          <div className="table-col">
            <button
              className="modal-save-btn"
              style={{ marginBottom: 8, width: "100%" }}
              onClick={() => setShowAddFloor((v) => !v)}
            >
              {showAddFloor ? "층 추가 취소" : "층 추가"}
            </button>
            {showAddFloor && (
              <form className="inline-add-floor-form" onSubmit={handleAddFloor}>
                <select
                  value={addFloorBuilding}
                  onChange={(e) => setAddFloorBuilding(e.target.value)}
                  required
                >
                  <option value="">건물 선택</option>
                  {buildingOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={addFloorNum}
                  onChange={(e) => setAddFloorNum(e.target.value)}
                  min={1}
                  placeholder="층수"
                  required
                />
                <input
                  type="file"
                  accept="image/png"
                  ref={addFloorFileRef}
                  onChange={(e) => setAddFloorFile(e.target.files[0])}
                  required
                />
                <button type="submit" className="modal-save-btn">
                  저장
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddFloor(false)}
                >
                  취소
                </button>
                {addFloorError && (
                  <div className="modal-error">{addFloorError}</div>
                )}
              </form>
            )}
            <div className="building-table-wrap">
              <table className="building-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 100 }}>건물명</th>
                    <th style={{ minWidth: 60 }}>층</th>
                    <th style={{ minWidth: 150 }}>맵 파일</th>
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
                            <button
                              onClick={() => {
                                setPopupImg(row.file)
                                setPopupBuilding(row.building)
                                setPopupFloor(row.floor)
                                setEditFile(null)
                                setEditError("")
                                if (editFileRef.current)
                                  editFileRef.current.value = ""
                              }}
                            >
                              이미지 불러오기
                            </button>
                          ) : (
                            <span style={{ color: "#aaa" }}>없음</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="floor-delete-btn"
                            onClick={() =>
                              handleDeleteFloor(row.building, row.floor)
                            }
                            title="삭제"
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
          </div>
        </div>
      </div>

      {/* 팝업: 층 이미지+수정 */}
      {(popupImg !== null || (popupBuilding && popupFloor)) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setPopupImg(null)
            setEditFile(null)
            setEditError("")
            if (editFileRef.current) editFileRef.current.value = ""
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {popupImg && (
              <img
                src={`data:image/png;base64,${popupImg}`}
                alt="확대 이미지"
                style={{
                  maxWidth: "80vw",
                  maxHeight: "60vh",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            )}
            <div style={{ marginTop: 16 }}>
              <input
                type="file"
                accept="image/png"
                ref={editFileRef}
                onChange={(e) => setEditFile(e.target.files[0])}
              />
              <button style={{ marginLeft: 8 }} onClick={handleEditFloorMap}>
                수정
              </button>
              <button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setPopupImg(null)
                  setEditFile(null)
                  setEditError("")
                  if (editFileRef.current) editFileRef.current.value = ""
                }}
              >
                닫기
              </button>
            </div>
            {editError && (
              <div style={{ color: "red", marginTop: 8 }}>{editError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
