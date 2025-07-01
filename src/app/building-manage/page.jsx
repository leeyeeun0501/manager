// building-manage
"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import "./building-manage.css"
import { MdEditSquare, MdDelete } from "react-icons/md"
import { FaTrashAlt } from "react-icons/fa"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildingInfos, setBuildingInfos] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [buildingPage, setBuildingPage] = useState(1)
  const [floorPage, setFloorPage] = useState(1)
  const pageSize = 10

  // 건물/층 추가 폼 상태
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [addBuildingName, setAddBuildingName] = useState("")
  const [addBuildingX, setAddBuildingX] = useState("")
  const [addBuildingY, setAddBuildingY] = useState("")
  const [addBuildingDesc, setAddBuildingDesc] = useState("")
  const [addBuildingError, setAddBuildingError] = useState("")
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [addFloorBuilding, setAddFloorBuilding] = useState("")
  const [addFloorNum, setAddFloorNum] = useState("")
  const [addFloorFile, setAddFloorFile] = useState(null)
  const [addFloorError, setAddFloorError] = useState("")
  const addFloorFileRef = useRef(null)

  // 이미지 팝업 및 수정 상태
  const [popupImg, setPopupImg] = useState(null)
  const [popupFloor, setPopupFloor] = useState(null)
  const [popupBuilding, setPopupBuilding] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const [editError, setEditError] = useState("")
  const editFileRef = useRef(null)
  const [isBuildingMap, setIsBuildingMap] = useState(false)

  const [hoveredBuilding, setHoveredBuilding] = useState("")
  const [showEditDescModal, setShowEditDescModal] = useState(false)
  const [editDescBuilding, setEditDescBuilding] = useState("")
  const [editDescValue, setEditDescValue] = useState("")
  const [editDescError, setEditDescError] = useState("")

  const [addBuildingFile, setAddBuildingFile] = useState(null)
  const addBuildingFileRef = useRef(null)

  // 건물/층 옵션
  const buildingOptions = buildingInfos.map((b) => b.name)
  const floorOptions = Array.from(
    new Set(floors.map((f) => String(f.floor)))
  ).sort((a, b) => Number(a) - Number(b))

  // 건물 표 페이지네이션
  const buildingTotalPages = Math.max(
    1,
    Math.ceil((buildingInfos.length || 0) / pageSize)
  )
  const buildingPaged = buildingInfos.slice(
    (buildingPage - 1) * pageSize,
    buildingPage * pageSize
  )

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

  // 건물 추가 핸들러
  const handleAddBuilding = async (e) => {
    e.preventDefault()
    const x = Number(addBuildingX)
    const y = Number(addBuildingY)
    if (!addBuildingName || isNaN(x) || isNaN(y)) {
      setAddBuildingError("모든 값을 올바르게 입력하세요.")
      return
    }
    const formData = new FormData()
    formData.append("building_name", addBuildingName)
    formData.append("x", x)
    formData.append("y", y)
    formData.append("desc", addBuildingDesc)
    if (addBuildingFile) formData.append("file", addBuildingFile)

    try {
      const res = await fetch("/api/building-route", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAddBuildingError(data.error || "건물 추가 실패")
        return
      }
      alert("건물 추가가 완료되었습니다!")
      setShowAddBuilding(false)
      setAddBuildingName("")
      setAddBuildingX("")
      setAddBuildingY("")
      setAddBuildingDesc("")
      setAddBuildingFile(null)
      if (addBuildingFileRef.current) addBuildingFileRef.current.value = ""

      // 새로고침
      const buildingsRes = await fetch("/api/building-route")
      const buildingsData = await buildingsRes.json()
      const infos = (buildingsData.all || [])
        .filter((b) => b && b.Building_Name)
        .map((b) => ({
          name: b.Building_Name,
          desc: b.Description || "",
          file: b.file || null,
        }))
      setBuildingInfos(infos)
    } catch (err) {
      setAddBuildingError("건물 추가 중 오류가 발생했습니다.")
    }
  }

  // 건물 설명 수정 핸들러
  const handleEditDesc = async () => {
    setEditDescError("")
    if (!editDescBuilding) {
      setEditDescError("수정할 건물을 선택하세요.")
      return
    }
    try {
      const formData = new FormData()
      formData.append("desc", editDescValue)
      const res = await fetch(
        `/api/building-route?building=${encodeURIComponent(editDescBuilding)}`,
        {
          method: "PUT",
          body: formData,
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEditDescError(data.error || "설명 수정 실패")
        return
      }

      // 새로고침
      const buildingsRes = await fetch("/api/building-route")
      const buildingsData = await buildingsRes.json()
      setBuildingInfos(
        (buildingsData.all || []).map((b) => ({
          name: b.Building_Name,
          desc: b.Description || "",
        }))
      )
      setShowEditDescModal(false)
      setEditDescBuilding("")
      setEditDescValue("")
    } catch (err) {
      setEditDescError("설명 수정 중 오류가 발생했습니다.")
    }
  }

  // 건물 맵 파일 수정 핸들러
  const handleEditBuildingMap = async () => {
    setEditError("")
    if (!popupBuilding || !editFile) {
      setEditError("파일을 선택하세요.")
      return
    }
    const formData = new FormData()
    formData.append("file", editFile)

    try {
      const res = await fetch(
        `/api/building-route?building=${encodeURIComponent(popupBuilding)}`,
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
      const buildingsRes = await fetch("/api/building-route")
      const buildingsData = await buildingsRes.json()
      const infos = (buildingsData.all || [])
        .filter((b) => b && b.Building_Name)
        .map((b) => ({
          name: b.Building_Name,
          desc: b.Description || "",
          file: b.file || b.File || null,
        }))
      setBuildingInfos(infos)

      alert("맵 파일이 수정되었습니다!")
      setPopupImg(null)
      setEditFile(null)
      setEditError("")
      setIsBuildingMap(false)
      if (editFileRef.current) editFileRef.current.value = ""
      setPopupBuilding(null)
    } catch (err) {
      setEditError("맵 파일 수정 중 오류가 발생했습니다.")
    }
  }

  // 건물 삭제 핸들러
  const handleDeleteBuilding = async (buildingName) => {
    if (!window.confirm(`정말로 ${buildingName} 건물을 삭제하시겠습니까?`))
      return
    try {
      const res = await fetch(
        `/api/building-route?building_name=${encodeURIComponent(buildingName)}`,
        { method: "DELETE" }
      )
      const text = await res.text()
      if (res.status === 200) {
        setBuildingInfos((prev) => prev.filter((b) => b.name !== buildingName))
        alert(text)
      } else {
        alert(text)
      }
    } catch (err) {
      alert("건물 삭제 중 오류가 발생했습니다.")
    }
  }

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
              setBuildingPage(1)
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
        <div
          className="table-row"
          style={{ display: "flex", gap: 40, alignItems: "flex-start" }}
        >
          {/* 건물 표/추가 */}
          <div className="table-col" style={{ flex: 1, maxWidth: 500 }}>
            <button
              className="modal-save-btn"
              style={{ marginBottom: 8, width: "100%" }}
              onClick={() => setShowAddBuilding((v) => !v)}
            >
              {showAddBuilding ? "건물 추가 취소" : "건물 추가"}
            </button>
            {showAddBuilding && (
              <form
                className="inline-add-building-form"
                onSubmit={handleAddBuilding}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "#f8f8f8",
                  padding: 12,
                  borderRadius: 8,
                  maxWidth: 480,
                }}
              >
                <input
                  type="text"
                  value={addBuildingName}
                  onChange={(e) => setAddBuildingName(e.target.value)}
                  placeholder="건물명"
                  required
                  style={{ width: "100%" }}
                />
                <input
                  type="number"
                  value={addBuildingX}
                  onChange={(e) => setAddBuildingX(e.target.value)}
                  step="any"
                  placeholder="경도"
                  required
                  style={{ width: "100%" }}
                />
                <input
                  type="number"
                  value={addBuildingY}
                  onChange={(e) => setAddBuildingY(e.target.value)}
                  step="any"
                  placeholder="위도"
                  required
                  style={{ width: "100%" }}
                />
                <input
                  type="text"
                  value={addBuildingDesc}
                  onChange={(e) => setAddBuildingDesc(e.target.value)}
                  placeholder="설명"
                  required
                  style={{ width: "100%" }}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={addBuildingFileRef}
                  onChange={(e) => setAddBuildingFile(e.target.files[0])}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="submit"
                    className="modal-save-btn"
                    style={{ flex: 1 }}
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setShowAddBuilding(false)}
                    style={{ flex: 1 }}
                  >
                    취소
                  </button>
                </div>
                {addBuildingError && (
                  <div className="modal-error">{addBuildingError}</div>
                )}
              </form>
            )}
            <table className="building-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }}>건물명</th>
                  <th style={{ minWidth: 200 }}>건물 설명</th>
                  <th style={{ minWidth: 150 }}>맵 파일</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {buildingPaged.length > 0 ? (
                  buildingPaged.map((b, idx) => (
                    <tr key={b.name || idx}>
                      <td>{b.name}</td>
                      <td
                        style={{ position: "relative" }}
                        onMouseEnter={() => setHoveredBuilding(b.name)}
                        onMouseLeave={() => setHoveredBuilding("")}
                      >
                        {b.desc}
                        {hoveredBuilding === b.name && (
                          <button
                            style={{
                              position: "absolute",
                              right: 4,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              marginLeft: 8,
                              fontSize: 16,
                              opacity: 0.7,
                            }}
                            aria-label="설명 수정"
                            onClick={() => {
                              setEditDescBuilding(b.name)
                              setEditDescValue(b.desc)
                              setShowEditDescModal(true)
                              setEditDescError("")
                            }}
                            tabIndex={0}
                          >
                            <MdEditSquare size={18} color="#007bff" />
                          </button>
                        )}
                      </td>
                      <td>
                        {b.file ? (
                          <button
                            onClick={() => {
                              setPopupImg(b.file)
                              setPopupBuilding(b.name)
                              setPopupFloor(null)
                              setIsBuildingMap(true)
                              setEditFile(null)
                              setEditError("")
                              if (editFileRef.current)
                                editFileRef.current.value = ""
                            }}
                          >
                            이미지 불러오기
                          </button>
                        ) : (
                          // 맵 파일 없을 때 연필 아이콘
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#888",
                              fontSize: 18,
                              padding: 0,
                            }}
                            aria-label="맵 파일 추가"
                            onClick={() => {
                              setPopupImg(null)
                              setPopupBuilding(b.name)
                              setPopupFloor(null)
                              setIsBuildingMap(true)
                              setEditFile(null)
                              setEditError("")
                              if (editFileRef.current)
                                editFileRef.current.value = ""
                            }}
                          >
                            <MdEditSquare size={18} color="#007bff" />
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          className="building-delete-btn"
                          onClick={() => handleDeleteBuilding(b.name)}
                          title="삭제"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <MdDelete size={20} color="#e74c3c" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: "center", color: "#aaa" }}
                    >
                      건물 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="building-pagination-row">
              <button
                className="building-pagination-btn"
                onClick={() => setBuildingPage((p) => Math.max(1, p - 1))}
                disabled={buildingPage === 1}
              >
                이전
              </button>
              <span className="building-pagination-info">
                {buildingPage} / {buildingTotalPages}
              </span>
              <button
                className="building-pagination-btn"
                onClick={() =>
                  setBuildingPage((p) => Math.min(buildingTotalPages, p + 1))
                }
                disabled={buildingPage === buildingTotalPages}
              >
                다음
              </button>
            </div>
          </div>

          {/* 층 표/추가 */}
          <div className="table-col" style={{ flex: 1, maxWidth: 700 }}>
            <button
              className="modal-save-btn"
              style={{ marginBottom: 8, width: "100%" }}
              onClick={() => setShowAddFloor((v) => !v)}
            >
              {showAddFloor ? "층 추가 취소" : "층 추가"}
            </button>
            {showAddFloor && (
              <form
                className="inline-add-floor-form"
                onSubmit={handleAddFloor}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "#f8f8f8",
                  padding: 12,
                  borderRadius: 8,
                  maxWidth: 680,
                }}
              >
                <select
                  value={addFloorBuilding}
                  onChange={(e) => setAddFloorBuilding(e.target.value)}
                  required
                  style={{ width: "100%" }}
                >
                  <option value="">건물 선택</option>
                  {buildingOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={addFloorNum}
                  onChange={(e) => setAddFloorNum(e.target.value)}
                  min={1}
                  placeholder="층수"
                  required
                  style={{ width: "100%" }}
                />
                <input
                  type="file"
                  accept="image/png"
                  ref={addFloorFileRef}
                  onChange={(e) => setAddFloorFile(e.target.files[0])}
                  required
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="submit"
                    className="modal-save-btn"
                    style={{ flex: 1 }}
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setShowAddFloor(false)}
                    style={{ flex: 1 }}
                  >
                    취소
                  </button>
                </div>
                {addFloorError && (
                  <div className="modal-error">{addFloorError}</div>
                )}
              </form>
            )}
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
                              setIsBuildingMap(false)
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
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
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
                      colSpan={3}
                      style={{ textAlign: "center", color: "#aaa" }}
                    >
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

      {/* 건물 설명 수정 팝업 */}
      {showEditDescModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowEditDescModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12 }}>건물 설명 수정</h3>
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                value={editDescValue}
                onChange={(e) => setEditDescValue(e.target.value)}
                style={{ width: "100%", padding: 8, fontSize: 16 }}
                placeholder="설명을 입력하세요"
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="modal-save-btn" onClick={handleEditDesc}>
                수정
              </button>
              <button
                className="modal-cancel-btn"
                onClick={() => setShowEditDescModal(false)}
              >
                취소
              </button>
            </div>
            {editDescError && (
              <div style={{ color: "red", marginTop: 8 }}>{editDescError}</div>
            )}
          </div>
        </div>
      )}

      {/* 팝업: 이미지+수정 */}
      {(popupImg !== null || (isBuildingMap && popupBuilding)) && (
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
            setIsBuildingMap(false)
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
              <button
                style={{ marginLeft: 8 }}
                onClick={
                  isBuildingMap ? handleEditBuildingMap : handleEditFloorMap
                }
              >
                수정
              </button>
              <button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setPopupImg(null)
                  setEditFile(null)
                  setEditError("")
                  setIsBuildingMap(false)
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
