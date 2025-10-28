// floor-manage
"use client"
import "../globals.css"
import React, { useEffect, useState, useRef } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import styles from "./floor-manage.module.css"
import { FaTrashAlt, FaPaperclip } from "react-icons/fa"
import { apiGet, apiPost, apiPut, apiDelete, parseJsonResponse } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"

export default function BuildingPage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  // 스크롤바 제거 (즉시 실행)
  useEffect(() => {
    // 즉시 스크롤바 제거
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflowY = 'hidden'
    
    // 추가적인 스크롤바 제거를 위한 스타일 적용
    const style = document.createElement('style')
    style.textContent = `
      html, body {
        overflow: hidden !important;
        overflow-x: hidden !important;
        overflow-y: hidden !important;
        width: 100vw !important;
        height: 100vh !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.documentElement.style.overflowX = ''
      document.body.style.overflowX = ''
      document.documentElement.style.overflowY = ''
      document.body.style.overflowY = ''
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])
  
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

  // 팝업 메시지 상태
  const [toastMessage, setToastMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), duration)
  }

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
      const res = await apiPost("/api/floor-route", formData)
      const data = await parseJsonResponse(res)
      if (res.ok && data && !data.error) {
        showToast("층 추가가 완료되었습니다!")
        setShowAddFloor(false)
        setAddFloorBuilding("")
        setAddFloorNum("1")
        setAddFloorFile(null)
        if (addFloorFileRef.current) addFloorFileRef.current.value = ""

        // '전체 건물' 또는 특정 건물 상태에 따라 갱신
        await fetchFloors(selectedBuilding)
      } else {
        setAddFloorError(data.error || "층 추가 실패")
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
      return

    try {
      const res = await apiDelete(
        `/api/floor-route?building=${encodeURIComponent(
          buildingName
        )}&floor=${encodeURIComponent(floorNum)}`
      )
      const data = await parseJsonResponse(res)
      if (data && data.success) {
        setFloors(prev =>
          prev.filter(
            (f) =>
              !(
                String(f.building) === String(buildingName) &&
                String(f.floor) === String(floorNum)
              )
          )
        )
        showToast("층 삭제가 완료되었습니다.")
      } else {
        showToast(data.error || "층 삭제 실패")
      }
    } catch (err) {
      showToast("층 삭제 중 오류가 발생했습니다.")
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
      {/* 토스트 메시지 UI */}
      {toastVisible && <div className={styles.toastPopup}>{toastMessage}</div>}
      <span className={styles["building-header"]}>층 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles["building-content"]}>
        {/* 건물/층 선택 콤보박스 */}
        <div className={styles.filterContainer}>
          {/* 건물/층 콤보 박스 */}
          <div className={styles.selectGroup}>
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
                    <td className={styles.fileCell} onMouseEnter={() => setHoveredKey(`${row.building}-${row.floor}`)} onMouseLeave={() => setHoveredKey("")}>
                      {row.file ? (
                        <button
                          type="button"
                          className={styles.filePreviewBtn}
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
                              className={styles.addFileIconBtn} aria-label="맵 파일 추가"
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
                      >
                        <FaTrashAlt size={18} color="#e74c3c" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4} className={styles.noDataCell}>
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
          <div className={styles.modalBackdrop} onClick={() => setShowAddFloor(false)}>
            <div
              className={styles.modalContainer}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalTitle}>
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
                  className={styles.modalSelect}
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
                  className={styles.floorSelector}
                >
                  <input
                    type="text"
                    value={addFloorNum}
                    readOnly
                    required
                    className={styles.floorSelectorInput}
                  />
                  <div className={styles.floorSelectorButtons}>
                    <button
                      type="button"
                      onClick={handleFloorUp}
                      className={styles.floorArrowBtn}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={handleFloorDown}
                      className={styles.floorArrowBtn}
                    >
                      ▼
                    </button>
                  </div>
                </div>
                <div
                  className={styles.fileInputContainer}
                >
                  <ClipFileInput
                    onFileChange={(e) => setAddFloorFile(e.target.files[0])}
                    fileName={addFloorFile ? addFloorFile.name : ""}
                  />
                </div>
                {addFloorError && (
                  <div className={styles.modalErrorText}>
                    {addFloorError}
                  </div>
                )}
                <div className={styles.modalActionButtons}>
                  <button
                    type="button"
                    className={styles.modalCancelBtn}
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
                    className={styles.modalSubmitBtn}
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
          <div className={styles.modalBackdrop}
            onClick={() => {
              setMapModalOpen(false)
              setEditMapFile(null)
              setEditMapError("")
              if (editMapFileRef.current) editMapFileRef.current.value = ""
            }}
          >
            <div
              className={styles.mapModalContainer}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.mapModalCloseBtn}
                onClick={() => setMapModalOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
              <div
                className={styles.mapModalTitle}
              >
                2D 도면 미리보기
              </div>
              <div className={styles.mapModalInfo}>
                {/* 건물명/층수 표시 */}
                <div className={styles.mapModalBuildingInfo}>
                  건물명: {editMapBuilding} / 층수: {editMapFloor}
                </div>
              </div>
              {/* 도면 이미지 */}
              <object
                type="image/svg+xml"
                data={getCacheBustedUrl(mapModalFile)}
                className={styles.mapModalSvgObject}
              >
                SVG 미리보기를 지원하지 않는 브라우저입니다.
              </object>
              {/* 파일 선택 + 수정 버튼을 이미지 아래에 세로로 */}
              <form
                className={styles.mapModalForm}
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
                      showToast("도면이 성공적으로 수정되었습니다!")
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
                <div className={styles.fileInputContainer}>
                  <ClipFileInput
                    onFileChange={(e) => setEditMapFile(e.target.files[0])}
                    fileName={editMapFile ? editMapFile.name : ""}
                    accept=".svg"
                    fileInputRef={editMapFileRef}
                  />
                </div>
                {editMapError && (
                  <div className={styles.modalErrorText}>
                    {editMapError}
                  </div>
                )}
                <button
                  type="submit"
                  className={styles.mapModalSubmitBtn}
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
          <div className={styles.modalBackdrop}
            onClick={() =>
              setFileAddModal({ open: false, building: "", floor: "" })
            }
          >
            <div
              className={styles.modalContainer}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={styles.modalTitle}
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
                      showToast("도면이 성공적으로 추가되었습니다!")
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
                <div className={styles.modalBuildingInfo}>
                  {" "}
                  건물명: {fileAddModal.building} / 층수: {fileAddModal.floor}
                </div>
                {/* 파일 선택 */}
                <div className={styles.fileInputContainer}>
                  <ClipFileInput
                    onFileChange={(e) => setAddFile(e.target.files[0])}
                    fileName={addFile ? addFile.name : ""}
                  />
                </div>
                {addFileError && (
                  <div className={styles.modalErrorText}>
                    {addFileError}
                  </div>
                )}
                <div className={styles.modalActionButtons}>
                  <button
                    type="button"
                    className={styles.modalCancelBtn}
                    onClick={() =>
                      setFileAddModal({ open: false, building: "", floor: "" })
                    }
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={styles.modalSubmitBtn}
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
