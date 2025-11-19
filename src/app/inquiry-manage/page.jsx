// 문의 관리
"use client"
import React, { useEffect, useState, useCallback, useMemo } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import "../globals.css"
import styles from "./inquiry-manage.module.css"
import { apiGet, parseJsonResponse, extractDataList } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"
import { useToast } from "../utils/useToast"
import { usePagination } from "../utils/usePagination"
import { useCategoryFilter } from "../utils/useSearchFilter"
import InquiryStats from "./InquiryStats"
import InquiryTable from "./InquiryTable"
import AnswerModal from "./AnswerModal"
import ImageModal from "./ImageModal"

export default function InquiryPage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)

  // 모달 관련
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)

  // 사진 모달
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState("")

  // 토스트 메시지 훅
  const { toastMessage, toastVisible, showToast } = useToast()

  // 카테고리 필터링 훅
  const { category, setCategory, filteredData: filteredInquiries, categories: categoryOptions } = useCategoryFilter(
    inquiries,
    'category',
    'all'
  )

  // 페이징 훅
  const itemsPerPage = 7
  const { currentPage, totalPages, pagedData: pagedInquiries, setCurrentPage, goToPrevPage, goToNextPage } = usePagination(
    filteredInquiries,
    itemsPerPage
  )

  // 문의 정보 fetch
  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet("/api/inquiry-route")
      const data = await parseJsonResponse(res)
      
      // extractDataList 유틸리티 사용
      const list = extractDataList(data, 'inquiries')
      
      const mappedList = list.map((item) => ({
        id: item.User_Id,
        inquiry_code: item.Inquiry_Code,
        category: item.Category,
        title: item.Title,
        content: item.Content,
        image_url: item.Image_Path,
        status: item.Status
          ? item.Status === "pending"
            ? "답변 대기"
            : item.Status === "answered"
            ? "답변 완료"
            : item.Status
          : "답변 대기",
        answer: item.Answer,
        answered_at: item.Answered_At,
        created_at: item.Created_At,
      }))
      setInquiries(mappedList)
    } catch (err) {
      // 세션 만료 에러는 전역 처리기(handleTokenExpired)에 맡기고, 그 외의 에러만 처리합니다.
      if (err.message !== "세션 만료") {
        console.error("문의 목록 로딩 실패:", err)
        setInquiries([])
      }
    }
    setLoading(false)
  }, [])

  // 문의 목록 로드
  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  // 통계 계산 (메모이제이션)
  const inquiryStats = useMemo(() => {
    const total = inquiries.length
    const pending = inquiries.filter((q) => q.status === "답변 대기").length
    const answered = inquiries.filter(
      (q) => q.status === "answered" || q.status === "답변 완료"
    ).length
    const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0
    return { total, pending, answered, answerRate }
  }, [inquiries])

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((value) => {
    setCategory(value)
    setCurrentPage(1)
  }, [setCategory, setCurrentPage])

  // 모달 열기/닫기 핸들러
  const openModal = useCallback((inquiry) => {
    setSelectedInquiry(inquiry)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedInquiry(null)
  }, [])

  const openImageModal = useCallback((imageUrl) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }, [])

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false)
    setSelectedImage("")
  }, [])

  // 답변 제출 후 콜백
  const handleAnswerSubmitted = useCallback(() => {
    fetchInquiries()
  }, [fetchInquiries])

  return (
    <div className={styles.inquiryRoot}>
      {loading && <LoadingOverlay />}
      {/* 토스트 메시지 UI */}
      {toastVisible && (
        <div className={styles.toastPopup}>{toastMessage}</div>
      )}
      <span className={styles.inquiryHeader}>문의 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles.inquiryContent}>
        {!loading && (
          <>
            {/* 콤보박스 + 통계 카드 한 줄 */}
            <div className={styles.filterAndStatsRow}>
              <select
                id="category-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={styles.inquiryFilterSelect}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <InquiryStats stats={inquiryStats} />
            </div>

            {/* 테이블 */}
            <InquiryTable
              inquiries={pagedInquiries}
              onAnswerClick={openModal}
              onImageClick={openImageModal}
            />

            {/* 페이징 */}
            <div className={styles.inquiryPaginationRow}>
              <button
                className={styles.inquiryPaginationBtn}
                disabled={currentPage === 1}
                onClick={goToPrevPage}
              >
                이전
              </button>
              <span className={styles.inquiryPaginationInfo}>
                {currentPage} / {totalPages}
              </span>
              <button
                className={styles.inquiryPaginationBtn}
                disabled={currentPage >= totalPages}
                onClick={goToNextPage}
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>

      {/* 답변 모달 */}
      <AnswerModal
        isOpen={isModalOpen}
        inquiry={selectedInquiry}
        onClose={closeModal}
        onAnswerSubmitted={handleAnswerSubmitted}
        showToast={showToast}
      />

      {/* 사진 모달 */}
      <ImageModal
        isOpen={isImageModalOpen}
        imageUrl={selectedImage}
        onClose={closeImageModal}
      />
    </div>
  )
}
