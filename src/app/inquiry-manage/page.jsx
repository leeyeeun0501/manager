// 문의 관리 페이지
"use client"
import React, { useEffect, useState, useCallback } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import Image from "next/image"
import { FaRegCommentDots } from "react-icons/fa"
import "../globals.css"
import styles from "./inquiry-manage.module.css"
import { apiGet, apiPut, parseJsonResponse } from "../utils/apiHelper"
import { useSessionCheck } from "../utils/useSessionCheck"

export default function InquiryPage() {
  // 세션 체크 활성화
  useSessionCheck()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [categoryOptions, setCategoryOptions] = useState([])

  // 모달 관련
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [answerText, setAnswerText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 사진 모달
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState("")

  // 번역 관련 상태
  const [showTranslation, setShowTranslation] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState("")
  const [translatedContent, setTranslatedContent] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)

  // 페이징
  const itemsPerPage = 7
  const [currentPage, setCurrentPage] = useState(1)

  // 문의 통계 상태
  const [inquiryStats, setInquiryStats] = useState({
    total: 0,
    pending: 0,
    answered: 0,
    answerRate: 0,
  })

  // 팝업 메시지 상태
  const [toastMessage, setToastMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), duration)
  }

  // 텍스트 자르기 함수
  const truncateText = (text, maxLength = 20) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet("/api/inquiry-route")
      const data = await parseJsonResponse(res)
      
      // data.data 구조로 변경 - 이중 중첩 처리
      let list = []
      if (data.inquiries && Array.isArray(data.inquiries)) {
        list = data.inquiries
      } else if (data.data?.data?.inquiries && Array.isArray(data.data.data.inquiries)) {
        list = data.data.data.inquiries
      } else if (data.data?.inquiries && Array.isArray(data.data.inquiries)) {
        list = data.data.inquiries
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data
      } else if (Array.isArray(data)) {
        list = data
      }
      
      const mappedList = list.map((item) => ({
        id: item.User_Id,
        inquiry_code: item.Inquiry_Code,
        category: item.Category,
        title: item.Title,
        content: item.Content,
        image_url: item.Image_Path,
        // 여기서 변환
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
      setInquiries([])
    }
    setLoading(false)
  }, [])

  const calculateStats = useCallback((inquiryList) => {
    const total = inquiryList.length
    const pending = inquiryList.filter((q) => q.status === "답변 대기").length
    const answered = inquiryList.filter(
      (q) => q.status === "answered" || q.status === "답변 완료"
    ).length
    const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0
    setInquiryStats({ total, pending, answered, answerRate })
  }, [])

  const generateCategoryOptions = useCallback((inquiryList) => {
    const categories = [
      ...new Set(inquiryList.map((item) => item.category).filter(Boolean)),
    ]
    const defaultCategories = [
      "경로 안내 오류",
      "장소/정보 오류",
      "버그 신고",
      "기능 제안",
      "기타 문의",
    ]
    const allCategories = [...new Set([...categories, ...defaultCategories])]
    const options = [
      { value: "all", label: "문의 유형 전체" },
      ...allCategories.map((cat) => ({ value: cat, label: cat })),
    ]
    setCategoryOptions(options)
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  useEffect(() => {
    if (inquiries.length > 0) {
      calculateStats(inquiries)
      generateCategoryOptions(inquiries)
    } else {
      setInquiryStats({ total: 0, pending: 0, answered: 0, answerRate: 0 })
      setCategoryOptions([{ value: "all", label: "문의 유형 전체" }])
    }
  }, [inquiries, calculateStats, generateCategoryOptions])

  // 모달·사진·답변 함수
  const openModal = useCallback((inquiry) => {
    setSelectedInquiry(inquiry)
    setAnswerText(inquiry.answer || "")
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedInquiry(null)
    setAnswerText("")
    setShowTranslation(false)
    setTranslatedTitle("")
    setTranslatedContent("")
    setIsTranslating(false)
  }, [])

  const openImageModal = useCallback((imageUrl) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }, [])

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false)
    setSelectedImage("")
  }, [])

  // 번역 함수  ??????
  // 수정 예정
  const handleTranslate = useCallback(async () => {
    if (!selectedInquiry) return

    setIsTranslating(true)
    setShowTranslation(true)

    try {
      const textsToTranslate = [
        selectedInquiry.title || "제목 없음",
        selectedInquiry.content || "내용 없음",
      ]

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLang: "ko",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "번역에 실패했습니다.")
      }

      const data = await response.json()
      const [titleResult, contentResult] = data.results

      setTranslatedTitle(titleResult?.translatedText || "번역 결과 없음")
      setTranslatedContent(contentResult?.translatedText || "번역 결과 없음")
    } catch (error) {
      setTranslatedTitle("번역 오류")
      setTranslatedContent(error.message)
    } finally {
      setIsTranslating(false)
    }
  }, [selectedInquiry])

  const toggleTranslation = useCallback(() => {
    if (showTranslation) {
      setShowTranslation(false)
      setTranslatedTitle("")
      setTranslatedContent("")
    } else {
      handleTranslate()
    }
  }, [showTranslation, handleTranslate])

  const submitAnswer = useCallback(async () => {
    if (!answerText.trim()) {
      alert("답변 내용을 입력해주세요.")
      return
    }

    const requestData = {
      inquiry_code:
        selectedInquiry.inquiry_code ||
        `INQ-${String(selectedInquiry.id).padStart(4, "0")}`,
      answer: answerText.trim(),
    }


    setSubmitting(true)
    try {
      const res = await apiPut("/api/inquiry-route", requestData)
      const data = await parseJsonResponse(res)
      if (data.success) {
        showToast("답변이 성공적으로 등록되었습니다.")
        closeModal()
        fetchInquiries()
      } else {
        showToast(data.error || "답변 등록에 실패했습니다.")
      }
    } catch (error) {
      showToast("서버 오류가 발생했습니다.")
    }
    setSubmitting(false)
  }, [selectedInquiry, answerText, closeModal, fetchInquiries, showToast])

  // 카테고리, 페이징
  const filtered =
    category === "all"
      ? inquiries
      : inquiries.filter((q) => q.category === category)

  const totalInquiries = filtered.length

  const totalPages = Math.max(1, Math.ceil(totalInquiries / itemsPerPage))

  const pagedInquiries = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className={styles.inquiryRoot}>
      {loading && <LoadingOverlay />}
      {/* 토스트 메시지 UI */}
      {toastVisible && (
        <div className={styles.toastPopup}>
          {toastMessage}
        </div>
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
                onChange={(e) => {
                  setCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className={styles.inquiryFilterSelect}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className={styles.inquiryStatsContainer}>
                <div className={styles.inquiryStatsBox}>
                  <div className={styles.statsLabel}>전체</div>
                  <div className={styles.statsValue}>{inquiryStats.total}</div>
                </div>
                <div className={styles.inquiryStatsBox}>
                  <div className={styles.statsLabel}>대기중</div>
                  <div className={styles.statsValue}>
                    {inquiryStats.pending}
                  </div>
                </div>
                <div className={styles.inquiryStatsBox}>
                  <div className={styles.statsLabel}>답변완료</div>
                  <div className={styles.statsValue}>
                    {inquiryStats.answered}
                  </div>
                </div>
                <div className={styles.inquiryStatsBox}>
                  <div className={styles.statsLabel}>답변율</div>
                  <div className={styles.statsValue}>
                    {inquiryStats.answerRate}%
                  </div>
                </div>
              </div>
            </div>

            <table className={`${styles.inquiryTable} ${styles.centerTable}`}>
              <thead>
                <tr>
                  <th>문의 코드</th>
                  <th>ID</th>
                  <th>문의 유형</th>
                  <th>제목</th>
                  <th>내용</th>
                  <th>사진</th>
                  <th>상태</th>
                  <th>답변</th>
                </tr>
              </thead>
              <tbody>
                {pagedInquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8} className={styles.noInquiries}>
                      문의가 없습니다.
                    </td>
                  </tr>
                ) : (
                  pagedInquiries.map((q, idx) => (
                    <tr
                      key={q.inquiry_code || q.id || idx}
                      className={styles.inquiryTableRow}
                    >
                      <td>
                        {q.inquiry_code ||
                          `INQ-${String(q.id || idx).padStart(4, "0")}`}
                      </td>
                      <td>{q.id || "-"}</td>
                      <td>{q.category || "일반"}</td>
                      <td title={q.title || "제목 없음"}>
                        {truncateText(q.title || "제목 없음", 15)}
                      </td>
                      <td title={q.content || "내용 없음"}>
                        {truncateText(q.content || "내용 없음", 20)}
                      </td>
                      <td>
                        {!!q.image_url ? (
                          <Image
                            src={q.image_url}
                            alt="문의 사진"
                            width={48}
                            height={48} className={styles.inquiryImage}
                            onClick={() => openImageModal(q.image_url)}
                          />
                        ) : (
                          <span className={styles.noImageText}>
                            사진 없음
                          </span>
                        )}
                      </td>
                      <td>{q.status || "대기중"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className={styles.answerBtn}
                          onClick={() => openModal(q)}
                          title="답변 작성"
                        >
                          <FaRegCommentDots />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* 페이징 */}
            <div className={styles.inquiryPaginationRow}>
              <button
                className={styles.inquiryPaginationBtn}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                이전
              </button>
              <span className={styles.inquiryPaginationInfo}>
                {currentPage} / {totalPages}
              </span>
              <button
                className={styles.inquiryPaginationBtn}
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
      {/* 답변 모달 */}
      {isModalOpen && selectedInquiry && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>문의 답변</h3>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inquiryInfo}>
                <div className={styles.modalSubHeader}>
                  <h4>문의 정보</h4>
                  <button
                    onClick={toggleTranslation}
                    disabled={isTranslating}
                    className={`${styles.translateBtn} ${showTranslation ? styles.translateBtnActive : ''}`}
                  >
                    {isTranslating
                      ? "번역 중..."
                      : showTranslation
                      ? "번역 숨기기"
                      : "번역 보기"}
                  </button>
                </div>
                <p>
                  <strong>문의 코드:</strong>{" "}
                  {selectedInquiry.inquiry_code ||
                    `INQ-${String(selectedInquiry.id).padStart(4, "0")}`}
                </p>
                <p>
                  <strong>제목:</strong> {selectedInquiry.title || "제목 없음"}
                </p>
                <p>
                  <strong>내용:</strong>{" "}
                  {selectedInquiry.content || "내용 없음"}
                </p>
                <p>
                  <strong>상태:</strong> {selectedInquiry.status || "대기중"}
                </p>

                {/* 번역 결과 표시 */}
                {showTranslation && (
                  <div className={styles.translationBox}>
                    <h5 className={styles.translationTitle}>
                      한국어 번역
                    </h5>
                    <p className={styles.translationText}>
                      <strong>제목:</strong> {translatedTitle}
                    </p>
                    <p className={styles.translationText}>
                      <strong>내용:</strong> {translatedContent}
                    </p>
                  </div>
                )}
              </div>
              <div className={styles.answerSection}>
                <h4>{selectedInquiry.answer ? "답변 수정" : "답변 작성"}</h4>
                <textarea
                  className={styles.answerTextarea}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="답변 내용을 입력하세요..."
                  rows={6}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalCancelBtn}
                onClick={closeModal}
                disabled={submitting}
              >
                취소
              </button>
              <button
                className={styles.modalSubmitBtn}
                onClick={submitAnswer}
                disabled={submitting || !answerText.trim()}
              >
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 사진 모달 */}
      {isImageModalOpen && selectedImage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>문의 사진</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={closeImageModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <Image
                src={selectedImage}
                alt="문의 사진"
                width={600}
                height={600} className={styles.modalImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
