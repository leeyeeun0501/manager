"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import Image from "next/image"
import "../globals.css"
import styles from "./inquiry-manage.module.css"

const CATEGORY_OPTIONS = [
  { value: "all", label: "문의 유형 전체" },
  { value: "path", label: "경로 안내 오류" },
  { value: "place", label: "장소/정보 오류" },
  { value: "bug", label: "버그 신고" },
  { value: "feature", label: "기능 제안" },
  { value: "etc", label: "기타 문의" },
]

export default function InquiryPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  // 모달 관련
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [answerText, setAnswerText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 페이징 관련
  const itemsPerPage = 20
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("INQUIRY_MANAGE_PAGE")
      return saved ? Number(saved) : 1
    }
    return 1
  })

  useEffect(() => {
    fetchInquiries()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    localStorage.setItem("INQUIRY_MANAGE_PAGE", currentPage)
  }, [currentPage])

  // 문의 불러오기 (API 구조에 맞게 파싱, 로그 추가)
  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inquiry-route")
      const data = await res.json()
      console.log("문의 목록 응답:", data)
      let list = []
      if (Array.isArray(data)) {
        list = data
      } else if (Array.isArray(data.inquiries)) {
        list = data.inquiries
      }

      // 서버 필드명을 클라이언트 필드명으로 매핑
      const mappedList = list.map((item) => ({
        id: item.User_Id,
        inquiry_code: item.Inquiry_Code,
        category: item.Category,
        title: item.Title,
        content: item.Content,
        image_url: item.Image_Path,
        status: item.Status,
        answer: item.Answer,
        answered_at: item.Answered_At,
        created_at: item.Created_At,
      }))

      console.log("매핑된 데이터:", mappedList)
      setInquiries(mappedList)
    } catch (err) {
      console.error("데이터 가져오기 오류:", err)
      setInquiries([])
    }
    setLoading(false)
  }

  // 모달 열기/닫기
  const openModal = (inquiry) => {
    setSelectedInquiry(inquiry)
    setAnswerText("")
    setIsModalOpen(true)
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedInquiry(null)
    setAnswerText("")
  }

  // 답변 등록
  const submitAnswer = async () => {
    if (!answerText.trim()) {
      alert("답변 내용을 입력해주세요.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/inquiry-route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_code:
            selectedInquiry.inquiry_code ||
            `INQ-${String(selectedInquiry.id).padStart(4, "0")}`,
          answer: answerText.trim(),
        }),
      })
      const data = await res.json()
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

  // 카테고리별 필터
  const filtered =
    category === "all"
      ? inquiries
      : inquiries.filter((q) => (q.category || "general") === category)

  // 페이징
  const totalInquiries = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalInquiries / itemsPerPage))
  const pagedInquiries = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className={styles.inquiryRoot}>
      <span className={styles.inquiryHeader}>문의 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles.inquiryContent}>
        {/* 필터 */}
        <div className={styles.inquiryFilterSection}>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.inquiryFilterSelect}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className={styles.inquiryLoading}>로딩 중...</div>
        ) : (
          <>
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
                      onClick={() => openModal(q)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {q.inquiry_code ||
                          `INQ-${String(q.id || idx).padStart(4, "0")}`}
                      </td>
                      <td>{q.id || "-"}</td>
                      <td>
                        {CATEGORY_OPTIONS.find(
                          (opt) => opt.value === (q.category || "general")
                        )?.label || "일반"}
                      </td>
                      <td>{q.title || "제목 없음"}</td>
                      <td>{q.content || "내용 없음"}</td>
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
                            }}
                          />
                        ) : (
                          <Image
                            src="/file.svg"
                            alt="기본 이미지"
                            width={32}
                            height={32}
                            style={{
                              opacity: 0.5,
                            }}
                          />
                        )}
                      </td>
                      <td>{q.status || "대기중"}</td>
                      <td>
                        <span className={styles.replyText}>답변</span>
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
                <h4>문의 정보</h4>
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
              </div>
              <div className={styles.answerSection}>
                <h4>답변 작성</h4>
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
    </div>
  )
}
