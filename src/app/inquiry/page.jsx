// inquiry
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import LoadingOverlay from "../components/loadingoverlay"
import Image from "next/image"
import { FaRegCommentDots } from "react-icons/fa"
import "../globals.css"
import styles from "./inquiry-manage.module.css"

export default function InquiryPage() {
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
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("INQUIRY_MANAGE_PAGE")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  // 문의 통계 상태
  const [inquiryStats, setInquiryStats] = useState({
    total: 0,
    pending: 0,
    answered: 0,
    answerRate: 0,
  })

  // 텍스트 자르기 함수
  const truncateText = (text, maxLength = 20) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  useEffect(() => {
    localStorage.setItem("INQUIRY_MANAGE_PAGE", currentPage)
  }, [currentPage])

  // 문의 불러오기
  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inquiry-route")
      const data = await res.json()
      let list = []
      if (Array.isArray(data)) list = data
      else if (Array.isArray(data.inquiries)) list = data.inquiries
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

      // 문의 통계 계산
      const total = mappedList.length
      const pending = mappedList.filter(
        (q) => q.status === "pending" || q.status === "대기 중" || !q.status
      ).length
      const answered = mappedList.filter(
        (q) => q.status === "answered" || q.status === "답변 완료"
      ).length
      const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0

      const stats = {
        total,
        pending,
        answered,
        answerRate,
      }
      setInquiryStats(stats)

      const categories = [
        ...new Set(mappedList.map((item) => item.category).filter(Boolean)),
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
    } catch (err) {
      setInquiries([])
      setCategoryOptions([{ value: "all", label: "문의 유형 전체" }])
      setInquiryStats({ total: 0, pending: 0, answered: 0, answerRate: 0 })
    }
    setLoading(false)
  }

  // 모달·사진·답변 함수
  const openModal = (inquiry) => {
    setSelectedInquiry(inquiry)
    setAnswerText(inquiry.answer || "")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedInquiry(null)
    setAnswerText("")
    setShowTranslation(false)
    setTranslatedTitle("")
    setTranslatedContent("")
    setIsTranslating(false)
  }

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImage("")
  }

  // 번역 함수  ??????
  // 수정 예정
  const handleTranslate = async () => {
    if (!selectedInquiry) return

    setIsTranslating(true)
    setShowTranslation(true)

    try {
      // 제목 번역
      const titleResponse = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedInquiry.title || "제목 없음",
          targetLang: "ko",
        }),
      })
      const titleData = await titleResponse.json()
      setTranslatedTitle(titleData.translatedText || "번역 실패")

      // 내용 번역
      const contentResponse = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedInquiry.content || "내용 없음",
          targetLang: "ko",
        }),
      })
      const contentData = await contentResponse.json()
      setTranslatedContent(contentData.translatedText || "번역 실패")
    } catch (error) {
      console.error("번역 오류:", error)
      setTranslatedTitle("번역 중 오류가 발생했습니다.")
      setTranslatedContent("번역 중 오류가 발생했습니다.")
    } finally {
      setIsTranslating(false)
    }
  }

  const toggleTranslation = () => {
    if (showTranslation) {
      setShowTranslation(false)
      setTranslatedTitle("")
      setTranslatedContent("")
    } else {
      handleTranslate()
    }
  }

  const submitAnswer = async () => {
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

    console.log("전송할 데이터:", requestData)
    console.log("선택된 문의:", selectedInquiry)

    setSubmitting(true)
    try {
      const res = await fetch("/api/inquiry-route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
      const data = await res.json()
      console.log("서버 응답:", data)
      if (res.ok && data.success) {
        alert("답변이 성공적으로 등록되었습니다.")
        closeModal()
        fetchInquiries()
      } else {
        alert(data.error || "답변 등록에 실패했습니다.")
      }
    } catch (error) {
      console.error("답변 등록 오류:", error)
      alert("서버 오류가 발생했습니다.")
    }
    setSubmitting(false)
  }

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
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "#888",
                      }}
                    >
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
                            height={48}
                            style={{
                              borderRadius: 8,
                              objectFit: "cover",
                              background: "#f5f6fa",
                              cursor: "pointer",
                            }}
                            onClick={() => openImageModal(q.image_url)}
                          />
                        ) : (
                          <span
                            style={{
                              color: "#999",
                              fontSize: "0.85rem",
                              fontStyle: "italic",
                            }}
                          >
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
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontSize: 22,
                            color: "#3b8dff",
                          }}
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h4>문의 정보</h4>
                  <button
                    onClick={toggleTranslation}
                    disabled={isTranslating}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #2574f5",
                      background: showTranslation ? "#2574f5" : "transparent",
                      color: showTranslation ? "white" : "#2574f5",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
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
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <h5
                      style={{
                        margin: "0 0 8px 0",
                        color: "#2574f5",
                        fontSize: "0.95rem",
                      }}
                    >
                      한국어 번역
                    </h5>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      <strong>제목:</strong> {translatedTitle}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
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
                height={600}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
