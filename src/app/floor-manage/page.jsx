// floor-manage
"use client"
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import styles from "./floor-manage.module.css"
import { apiGet, apiPost, apiPut, apiDelete, parseJsonResponse } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"
import { useToast } from "../utils/useToast"
import AddFloorModal from "./AddFloorModal"
import MapViewModal from "./MapViewModal"
import AddFileModal from "./AddFileModal"
import FloorTable from "./FloorTable"
import "../globals.css"

const FLOOR_LIST = [
  "B5", "B4", "B3", "B2", "B1",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
]

export default function BuildingPage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  // 스크롤바 제거
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflowY = 'hidden'
    
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

  // 토스트 메시지 훅
  const { toastMessage, toastVisible, showToast } = useToast()

  // 건물 옵션 메모이제이션
  const buildingOptions = useMemo(() => 
    buildingInfos.map((b) => b.name),
    [buildingInfos]
  )

  // 층 콤보박스 옵션 메모이제이션
  const floorNames = useMemo(() => 
    Array.from(
      new Set(floors.map((f) => String(f.floor)).filter(Boolean))
    ).sort((a, b) => Number(a) - Number(b)),
    [floors]
  )

  // 층 필터링 및 페이지네이션 메모이제이션
  const { floorFiltered, floorTotalPages, floorPaged } = useMemo(() => {
    const filtered = selectedFloor
      ? floors.filter((f) => String(f.floor) === String(selectedFloor))
      : floors
    
    const totalPages = Math.max(
      1,
      Math.ceil((filtered.length || 0) / pageSize)
    )
    
    const paged = filtered.slice(
      (floorPage - 1) * pageSize,
      floorPage * pageSize
    )
    
    return { floorFiltered: filtered, floorTotalPages: totalPages, floorPaged: paged }
  }, [floors, selectedFloor, floorPage, pageSize])

  const currentFloorIndex = useMemo(() => 
    FLOOR_LIST.indexOf(addFloorNum),
    [addFloorNum]
  )

  const getCacheBustedUrl = useCallback((url) => {
    if (!url) return url
    const separator = url.includes("?") ? "&" : "?"
    return url + separator + "ts=" + Date.now()
  }, [])

  // 층 정보 fetch 함수
  const fetchFloors = useCallback(async (buildingName) => {
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
  }, [])

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
  }, [selectedBuilding, fetchFloors])

  // 층 선택 핸들러
  const handleFloorUp = useCallback(() => {
    if (currentFloorIndex < FLOOR_LIST.length - 1) {
      setAddFloorNum(FLOOR_LIST[currentFloorIndex + 1])
    }
  }, [currentFloorIndex])

  const handleFloorDown = useCallback(() => {
    if (currentFloorIndex > 0) {
      setAddFloorNum(FLOOR_LIST[currentFloorIndex - 1])
    }
  }, [currentFloorIndex])

  // 건물 선택 핸들러
  const handleBuildingChange = useCallback((value) => {
    setSelectedBuilding(value)
    setSelectedFloor("")
    setFloorPage(1)
  }, [])

  // 층 필터 핸들러
  const handleFloorFilterChange = useCallback((value) => {
    setSelectedFloor(value)
    setFloorPage(1)
  }, [])

  // 층 추가 버튼 클릭 핸들러
  const handleAddFloorClick = useCallback(() => {
    setShowAddFloor(true)
    setAddFloorBuilding(selectedBuilding || "")
  }, [selectedBuilding])

  // 층 추가 모달 닫기 핸들러
  const handleCloseAddFloor = useCallback(() => {
    setShowAddFloor(false)
    setAddFloorBuilding("")
    setAddFloorNum("1")
    setAddFloorFile(null)
    setAddFloorError("")
    if (addFloorFileRef.current) {
      addFloorFileRef.current.value = ""
    }
  }, [])

  // 층 추가 핸들러
  const handleAddFloor = useCallback(async (e) => {
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
        handleCloseAddFloor()
        await fetchFloors(selectedBuilding)
      } else {
        setAddFloorError(data.error || "층 추가 실패")
      }
    } catch (err) {
      setAddFloorError("층 추가 중 오류가 발생했습니다.")
    }
  }, [addFloorBuilding, addFloorNum, addFloorFile, showToast, fetchFloors, selectedBuilding, handleCloseAddFloor])

  // 층 삭제 핸들러
  const handleDeleteFloor = useCallback(async (buildingName, floorNum) => {
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
  }, [showToast])

  // 맵 미리보기 핸들러
  const handleMapPreview = useCallback((row) => {
    setMapModalFile(row.file)
    setMapModalOpen(true)
    setEditMapBuilding(row.building)
    setEditMapFloor(row.floor)
    setEditMapFile(null)
    setEditMapError("")
  }, [])

  // 맵 모달 닫기 핸들러
  const handleCloseMapModal = useCallback(() => {
    setMapModalOpen(false)
    setEditMapFile(null)
    setEditMapError("")
    if (editMapFileRef.current) {
      editMapFileRef.current.value = ""
    }
  }, [])

  // 맵 파일 수정 핸들러
  const handleEditMapSubmit = useCallback(async (e) => {
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
        handleCloseMapModal()
      } else {
        setEditMapError(data.error || "도면 수정 실패")
      }
    } catch (err) {
      setEditMapError("도면 수정 중 오류가 발생했습니다.")
    }
    setEditMapLoading(false)
  }, [editMapFile, editMapBuilding, editMapFloor, showToast, fetchFloors, selectedBuilding, handleCloseMapModal])

  // 파일 추가 핸들러
  const handleAddFile = useCallback((row) => {
    setFileAddModal({
      open: true,
      building: row.building,
      floor: row.floor,
    })
    setAddFile(null)
    setAddFileError("")
    if (addFileRef.current) {
      addFileRef.current.value = ""
    }
  }, [])

  // 파일 추가 모달 닫기 핸들러
  const handleCloseAddFileModal = useCallback(() => {
    setFileAddModal({ open: false, building: "", floor: "" })
  }, [])

  // 파일 추가 제출 핸들러
  const handleAddFileSubmit = useCallback(async (e) => {
    e.preventDefault()
    setAddFileError("")
    if (!addFile) {
      setAddFileError("SVG 파일을 선택하세요.")
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
        await fetchFloors(fileAddModal.building)
        handleCloseAddFileModal()
      } else {
        setAddFileError(data.error || "도면 추가 실패")
      }
    } catch (err) {
      setAddFileError("도면 추가 중 오류가 발생했습니다.")
    }
    setAddFileLoading(false)
  }, [addFile, fileAddModal, showToast, fetchFloors, handleCloseAddFileModal])

  // 테이블 이벤트 핸들러
  const handleMouseEnter = useCallback((key) => {
    setHoveredKey(key)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredKey("")
  }, [])

  // 페이지네이션 핸들러
  const handlePrevPage = useCallback(() => {
    setFloorPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setFloorPage((p) => Math.min(floorTotalPages, p + 1))
  }, [floorTotalPages])

  return (
    <div className={styles["building-root"]}>
      {loading && <LoadingOverlay />}
      {toastVisible && <div className={styles.toastPopup}>{toastMessage}</div>}
      <span className={styles["building-header"]}>층 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles["building-content"]}>
        {/* 건물/층 선택 콤보박스 */}
        <div className={styles.filterContainer}>
          <div className={styles.selectGroup}>
            <select
              className={styles["building-select"]}
              value={selectedBuilding}
              onChange={(e) => handleBuildingChange(e.target.value)}
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
              onChange={(e) => handleFloorFilterChange(e.target.value)}
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

          <button
            className={styles["add-floor-btn"]}
            onClick={handleAddFloorClick}
            type="button"
          >
            층 추가
          </button>
        </div>

        {/* 표 */}
        <FloorTable
          floorPaged={floorPaged}
          hoveredKey={hoveredKey}
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMapPreview={handleMapPreview}
          onAddFile={handleAddFile}
          onDelete={handleDeleteFloor}
        />

        {/* 페이지네이션 */}
        <div className={styles["building-pagination-row"]}>
          <button
            className={styles["building-pagination-btn"]}
            onClick={handlePrevPage}
            disabled={floorPage === 1}
          >
            이전
          </button>
          <span className={styles["building-pagination-info"]}>
            {floorPage} / {floorTotalPages}
          </span>
          <button
            className={styles["building-pagination-btn"]}
            onClick={handleNextPage}
            disabled={floorPage === floorTotalPages}
          >
            다음
          </button>
        </div>

        {/* 층 추가 모달 */}
        <AddFloorModal
          showAddFloor={showAddFloor}
          addFloorBuilding={addFloorBuilding}
          addFloorNum={addFloorNum}
          addFloorFile={addFloorFile}
          addFloorError={addFloorError}
          buildingOptions={buildingOptions}
          floorList={FLOOR_LIST}
          currentFloorIndex={currentFloorIndex}
          onClose={handleCloseAddFloor}
          onBuildingChange={setAddFloorBuilding}
          onFloorUp={handleFloorUp}
          onFloorDown={handleFloorDown}
          onFileChange={(e) => setAddFloorFile(e.target.files[0])}
          onSubmit={handleAddFloor}
        />

        {/* 2D 도면 미리보기 모달 */}
        <MapViewModal
          mapModalOpen={mapModalOpen}
          mapModalFile={mapModalFile}
          editMapBuilding={editMapBuilding}
          editMapFloor={editMapFloor}
          editMapFile={editMapFile}
          editMapError={editMapError}
          editMapLoading={editMapLoading}
          selectedBuilding={selectedBuilding}
          editMapFileRef={editMapFileRef}
          onClose={handleCloseMapModal}
          onFileChange={(e) => setEditMapFile(e.target.files[0])}
          onSubmit={handleEditMapSubmit}
          getCacheBustedUrl={getCacheBustedUrl}
          fetchFloors={fetchFloors}
        />

        {/* 2D 도면 파일 추가 모달 */}
        <AddFileModal
          fileAddModal={fileAddModal}
          addFile={addFile}
          addFileError={addFileError}
          addFileLoading={addFileLoading}
          onClose={handleCloseAddFileModal}
          onFileChange={(e) => setAddFile(e.target.files[0])}
          onSubmit={handleAddFileSubmit}
        />
      </div>
    </div>
  )
}
