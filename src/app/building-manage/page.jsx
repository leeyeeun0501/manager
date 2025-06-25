// building
"use client"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import "./building.css"

export default function BuildingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState("")
  const [tableRows, setTableRows] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 7
  const [totalPages, setTotalPages] = useState(1)

  // 층 추가 인라인 폼 상태
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [addFloorBuilding, setAddFloorBuilding] = useState("")
  const [addFloorNum, setAddFloorNum] = useState("")
  const [addFloorFile, setAddFloorFile] = useState(null)
  const [addFloorError, setAddFloorError] = useState("")
  const addFloorFileRef = useRef(null)

  // 건물 추가 인라인 폼 상태
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [addBuildingName, setAddBuildingName] = useState("")
  const [addBuildingX, setAddBuildingX] = useState("")
  const [addBuildingY, setAddBuildingY] = useState("")
  const [addBuildingDesc, setAddBuildingDesc] = useState("")
  const [addBuildingError, setAddBuildingError] = useState("")

  // 강의실명/설명 수정 폼 상태
  const [editBuilding, setEditBuilding] = useState("")
  const [editBuildingIdx, setEditBuildingIdx] = useState(null)
  const [editClassroomIdx, setEditClassroomIdx] = useState(null)
  const [editField, setEditField] = useState("") // "desc", "name", "desc"
  const [editBuildingDesc, setEditBuildingDesc] = useState("")
  const [editClassroomName, setEditClassroomName] = useState("")
  const [editClassroomDesc, setEditClassroomDesc] = useState("")

  // 건물 임시값 배열
  const buildingOptions = Array.from({ length: 19 }, (_, i) => `W${i + 1}`)

  // 건물 목록 불러오기
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch buildings")
        const data = await res.json()
        const buildingSet = new Set()
        if (data.all) {
          data.all.forEach((item) => buildingSet.add(item.building))
        }
        setBuildings(Array.from(buildingSet).sort())
      } catch (err) {
        setBuildings([])
      }
    }
    fetchBuildings()
  }, [])

  // 건물 선택 시 층 목록 불러오기
  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([])
      setSelectedFloor("")
      setTableRows([])
      return
    }
    async function fetchFloors() {
      try {
        const res = await fetch(
          `/api/building-route?building=${encodeURIComponent(selectedBuilding)}`
        )
        if (!res.ok) throw new Error("Failed to fetch floors")
        const data = await res.json()
        setFloors(data.floors || [])
        setSelectedFloor("")
        setTableRows([])
      } catch (err) {
        setFloors([])
        setSelectedFloor("")
        setTableRows([])
      }
    }
    fetchFloors()
  }, [selectedBuilding])

  // 층 선택 시 강의실 목록 불러오기
  useEffect(() => {
    if (!selectedBuilding || !selectedFloor) {
      setTableRows([])
      return
    }
    async function fetchClassrooms() {
      try {
        const res = await fetch(
          `/api/building-route?building=${encodeURIComponent(
            selectedBuilding
          )}&floor=${encodeURIComponent(selectedFloor)}`
        )
        if (!res.ok) throw new Error("Failed to fetch classrooms")
        const data = await res.json()
        const rows = (data.classrooms || []).map((room) => ({
          building: selectedBuilding,
          desc: "", // 건물 설명은 별도 조회
          floor: selectedFloor,
          classroom: room.name,
          classroomDesc: room.desc,
        }))
        setTableRows(rows)
      } catch (err) {
        setTableRows([])
      }
    }
    fetchClassrooms()
  }, [selectedBuilding, selectedFloor])

  // 아무것도 선택 안 했을 때 전체 데이터 불러오기
  useEffect(() => {
    if (selectedBuilding || selectedFloor) return
    async function fetchAllRows() {
      try {
        const res = await fetch("/api/building-route")
        if (!res.ok) throw new Error("Failed to fetch all data")
        const data = await res.json()
        setTableRows(
          (data.all || []).map((row) => ({
            Building_Name: row.Building_Name,
            Building_Desc: row.Desc || "",
            Floor_Num: row.Floor_Num,
            Room_Name: row.Room_Name,
            Room_Desc: row.Room_Desc,
          }))
        )
      } catch (err) {
        setTableRows([])
      }
    }
    fetchAllRows()
  }, [selectedBuilding, selectedFloor])

  // 페이지네이션 계산
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(tableRows.length / pageSize)))
    setPage(1)
  }, [tableRows])

  const pagedRows = tableRows.slice((page - 1) * pageSize, page * pageSize)

  // 층 추가 인라인 폼 제출
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
      if (addFloorFileRef.current) addFloorFileRef.current.value = null
      // 데이터 새로고침
      if (selectedBuilding === addFloorBuilding) {
        const floorsRes = await fetch(
          `/api/building-route?building=${encodeURIComponent(addFloorBuilding)}`
        )
        const floorsData = await floorsRes.json()
        setFloors(floorsData.floors || [])
      }
    } catch (err) {
      setAddFloorError("층 추가 중 오류가 발생했습니다.")
    }
  }

  // 건물 추가 인라인 폼 제출
  const handleAddBuilding = async (e) => {
    e.preventDefault()
    const x = Number(addBuildingX)
    const y = Number(addBuildingY)

    if (!addBuildingName || isNaN(x) || isNaN(y)) {
      setAddBuildingError("모든 값을 올바르게 입력하세요.")
      return
    }

    const res = await fetch("/api/building-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building_name: addBuildingName,
        x,
        y,
        desc: addBuildingDesc,
      }),
    })

    // ...이하 생략
  }
  // 건물 설명 수정 버튼 클릭
  const handleEditBuildingClick = (building) => {
    setEditBuilding(building)
    // 건물 설명 조회
    fetch(`/api/building-route?building=${encodeURIComponent(building)}`)
      .then((res) => res.json())
      .then((data) => {
        setEditBuildingDesc(data?.desc || "")
      })
      .catch(() => setEditBuildingDesc(""))
  }

  // 건물 설명 수정 제출
  const handleEditBuildingSubmit = async (e) => {
    e.preventDefault()
    setEditBuildingError("")
    try {
      const res = await fetch("/api/building-route", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "building",
          building: editBuilding,
          desc: editBuildingDesc,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEditBuildingError(data.error || "수정 실패")
        return
      }
      alert("건물 설명이 수정되었습니다!")
      setEditBuilding("")
      // 데이터 새로고침
      if (selectedBuilding === editBuilding) {
        setSelectedBuilding("") // 리로드 유도
        setTimeout(() => setSelectedBuilding(editBuilding), 0)
      }
    } catch (err) {
      setEditBuildingError("수정 중 오류가 발생했습니다.")
    }
  }

  // 강의실명/설명 수정 버튼 클릭
  const handleEditClassroomClick = (rowIdx) => {
    setEditRowIdx(rowIdx)
    setEditClassroomName(tableRows[rowIdx].classroom)
    setEditClassroomDesc(tableRows[rowIdx].classroomDesc)
  }

  // 강의실명/설명 수정 제출
  const handleEditClassroomSubmit = async (e, row) => {
    e.preventDefault()
    setEditClassroomError("")
    try {
      const res = await fetch("/api/building-route", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "classroom",
          building: row.building,
          floor: row.floor,
          name: row.classroom,
          desc: editClassroomDesc,
          newName: editClassroomName,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEditClassroomError(data.error || "수정 실패")
        return
      }
      alert("강의실 정보가 수정되었습니다!")
      setEditRowIdx(null)
      // 데이터 새로고침
      if (selectedBuilding && selectedFloor) {
        const res = await fetch(
          `/api/building-route?building=${encodeURIComponent(
            selectedBuilding
          )}&floor=${encodeURIComponent(selectedFloor)}`
        )
        const data = await res.json()
        const rows = (data.classrooms || []).map((room) => ({
          building: selectedBuilding,
          desc: "", // 건물 설명은 별도 조회
          floor: selectedFloor,
          classroom: room.name,
          classroomDesc: room.desc,
        }))
        setTableRows(rows)
      }
    } catch (err) {
      setEditClassroomError("수정 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="building-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="building-content">
        <div className="building-filter-row">
          <select
            className="building-select"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">건물</option>
            {buildings.map((b, idx) => (
              <option key={b || idx} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            className="floor-select"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            disabled={!floors.length}
          >
            <option value="">층</option>
            {floors.map((f, idx) => (
              <option key={f || idx} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            className="add-floor-btn"
            onClick={() => setShowAddFloor((v) => !v)}
          >
            층 추가
          </button>
          <button
            className="add-building-btn"
            onClick={() => setShowAddBuilding((v) => !v)}
          >
            건물 추가
          </button>
        </div>

        {/* 층 추가 인라인 폼 */}
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
              type="number"
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

        {/* 건물 추가 인라인 폼 */}
        {showAddBuilding && (
          <form
            className="inline-add-building-form"
            onSubmit={handleAddBuilding}
          >
            <input
              type="text"
              value={addBuildingName}
              onChange={(e) => setAddBuildingName(e.target.value)}
              placeholder="건물명"
              required
            />
            <input
              type="number"
              value={addBuildingX}
              onChange={(e) => setAddBuildingX(e.target.value)}
              step="any"
              placeholder="경도"
              required
            />
            <input
              type="number"
              value={addBuildingY}
              onChange={(e) => setAddBuildingY(e.target.value)}
              step="any"
              placeholder="위도"
              required
            />
            <input
              type="text"
              value={addBuildingDesc}
              onChange={(e) => setAddBuildingDesc(e.target.value)}
              placeholder="설명"
              required
            />
            <button type="submit" className="modal-save-btn">
              저장
            </button>
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setShowAddBuilding(false)}
            >
              취소
            </button>
            {addBuildingError && (
              <div className="modal-error">{addBuildingError}</div>
            )}
          </form>
        )}

        {/* 건물 설명 수정 폼 */}
        {editBuilding && (
          <form
            className="inline-edit-building-form"
            onSubmit={handleEditBuildingSubmit}
          >
            <span>{editBuilding}</span>
            <input
              type="text"
              value={editBuildingDesc}
              onChange={(e) => setEditBuildingDesc(e.target.value)}
              placeholder="설명"
              required
            />
            <button type="submit" className="modal-save-btn">
              저장
            </button>
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setEditBuilding("")}
            >
              취소
            </button>
            {editBuildingError && (
              <div className="modal-error">{editBuildingError}</div>
            )}
          </form>
        )}

        <div className="building-table-wrap">
          <table className="building-table">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>건물</th>
                <th style={{ minWidth: 200 }}>건물 설명</th>
                <th style={{ minWidth: 60 }}>층</th>
                <th style={{ minWidth: 150 }}>강의실명</th>
                <th style={{ minWidth: 200 }}>강의실 설명</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length > 0 ? (
                pagedRows.map((row, idx) => (
                  <tr key={idx}>
                    {/* 건물명 */}
                    <td style={{ minWidth: 100 }}>{row.Building_Name}</td>

                    {/* 건물 설명 */}
                    <td style={{ minWidth: 200 }}>
                      {editBuildingIdx === idx && editField === "desc" ? (
                        <form
                          onSubmit={(e) => handleEditBuildingDescSubmit(e, row)}
                          style={{ display: "inline" }}
                        >
                          <input
                            type="text"
                            value={editBuildingDesc}
                            onChange={(e) =>
                              setEditBuildingDesc(e.target.value)
                            }
                          />
                          <button type="submit">저장</button>
                          <button
                            type="button"
                            onClick={() => setEditBuildingIdx(null)}
                          >
                            취소
                          </button>
                        </form>
                      ) : (
                        <>
                          {row.desc}
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setEditBuildingIdx(idx)
                              setEditField("desc")
                              setEditBuildingDesc(row.desc)
                            }}
                            style={{ marginLeft: 4 }}
                            title="건물 설명 수정"
                          >
                            ✏️
                          </button>
                        </>
                      )}
                    </td>

                    {/* 층 */}
                    <td style={{ minWidth: 60 }}>{row.floor}</td>

                    {/* 강의실명 */}
                    <td style={{ minWidth: 150 }}>
                      {editClassroomIdx === idx && editField === "name" ? (
                        <form
                          onSubmit={(e) =>
                            handleEditClassroomNameSubmit(e, row)
                          }
                          style={{ display: "inline" }}
                        >
                          <input
                            type="text"
                            value={editClassroomName}
                            onChange={(e) =>
                              setEditClassroomName(e.target.value)
                            }
                          />
                          <button type="submit">저장</button>
                          <button
                            type="button"
                            onClick={() => setEditClassroomIdx(null)}
                          >
                            취소
                          </button>
                        </form>
                      ) : (
                        <>
                          {row.classroom}
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setEditClassroomIdx(idx)
                              setEditField("name")
                              setEditClassroomName(row.classroom)
                            }}
                            style={{ marginLeft: 4 }}
                            title="강의실명 수정"
                          >
                            ✏️
                          </button>
                        </>
                      )}
                    </td>

                    {/* 강의실 설명 */}
                    <td style={{ minWidth: 200 }}>
                      {editClassroomIdx === idx && editField === "desc" ? (
                        <form
                          onSubmit={(e) =>
                            handleEditClassroomDescSubmit(e, row)
                          }
                          style={{ display: "inline" }}
                        >
                          <input
                            type="text"
                            value={editClassroomDesc}
                            onChange={(e) =>
                              setEditClassroomDesc(e.target.value)
                            }
                          />
                          <button type="submit">저장</button>
                          <button
                            type="button"
                            onClick={() => setEditClassroomIdx(null)}
                          >
                            취소
                          </button>
                        </form>
                      ) : (
                        <>
                          {row.classroomDesc}
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setEditClassroomIdx(idx)
                              setEditField("desc")
                              setEditClassroomDesc(row.classroomDesc)
                            }}
                            style={{ marginLeft: 4 }}
                            title="강의실 설명 수정"
                          >
                            ✏️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </button>
          <span className="building-pagination-info">
            {page} / {totalPages}
          </span>
          <button
            className="building-pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
