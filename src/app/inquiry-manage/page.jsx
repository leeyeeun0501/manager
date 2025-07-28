// inquiry-manage
"use client"
import "../globals.css"
import React, { useState, useEffect } from "react"
import Menu from "../components/menu"
import styles from "./inquiry-manage.module.css"
import { FaEye, FaReply, FaCheck, FaTimes } from "react-icons/fa"

export default function InquiryManagePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 모달 상태
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)

  // 답변 폼 상태
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // 문의 목록 조회
  useEffect(() => {
    fetchInquiries()
  }, [])

  async function fetchInquiries() {
    setLoading(true)
    try {
      const res = await fetch("/api/inquiry-route")
      if (!res.ok) throw new Error("문의 목록을 불러올 수 없습니다.")
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // 문의 상세 조회
  async function handleViewDetail(inquiry) {
    try {
      const res = await fetch(`/api/inquiry-route?id=${inquiry.id}`)
      if (!res.ok) throw new Error("문의 상세 정보를 불러올 수 없습니다.")
      const data = await res.json()
      setSelectedInquiry(data.inquiry)
      setShowDetailModal(true)
    } catch (err) {
      alert(err.message)
    }
  }

  // 답변 작성 모달 열기
  function handleOpenAnswerModal(inquiry) {
    setSelectedInquiry(inquiry)
    setAnswerContent("")
    setShowAnswerModal(true)
  }

  // 답변 제출
  async function handleSubmitAnswer(e) {
    e.preventDefault()
    if (!answerContent.trim()) {
      alert("답변 내용을 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/inquiry-route?id=${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerContent }),
      })

      if (!res.ok) throw new Error("답변 등록에 실패했습니다.")

      alert("답변이 성공적으로 등록되었습니다!")
      setShowAnswerModal(false)
      setAnswerContent("")
      fetchInquiries()
    } catch (err) {
      alert(err.message)
    }
    setSubmitting(false)
  }

  // 문의 상태 변경
  async function handleStatusChange(inquiryId, newStatus) {
    try {
      const res = await fetch(`/api/inquiry-route?id=${inquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error("상태 변경에 실패했습니다.")

      alert("상태가 변경되었습니다.")
      fetchInquiries()
    } catch (err) {
      alert(err.message)
    }
  }

  // 카테고리 한글명 변환
  function getCategoryName(category) {
    const categories = {
      general: "일반",
      technical: "기술",
      bug: "버그",
      feature: "기능요청",
      other: "기타",
    }
    return categories[category] || category
  }

  // 상태 한글명 변환
  function getStatusName(status) {
    const statuses = {
      pending: "대기중",
      answered: "답변완료",
      closed: "완료",
    }
    return statuses[status] || status
  }

  // 날짜 포맷팅
  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 필터링된 문의 목록
  const filteredInquiries = inquiries.filter((inquiry) => {
    const statusMatch =
      statusFilter === "all" || inquiry.status === statusFilter
    const categoryMatch =
      categoryFilter === "all" || inquiry.category === categoryFilter
    return statusMatch && categoryMatch
  })

  return (
    <div className={styles["inquiry-manage-root"]}>
      <span className={styles["inquiry-manage-header"]}>문의 관리</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className={styles["inquiry-manage-content"]}>
        {/* 필터 */}
        <div className={styles["filter-section"]}>
          <div className={styles["filter-group"]}>
            <label>상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="answered">답변완료</option>
              <option value="closed">완료</option>
            </select>
          </div>

          <div className={styles["filter-group"]}>
            <label>카테고리:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="general">일반</option>
              <option value="technical">기술</option>
              <option value="bug">버그</option>
              <option value="feature">기능요청</option>
              <option value="other">기타</option>
            </select>
          </div>
        </div>

        {/* 문의 목록 */}
        <div className={styles["inquiry-list"]}>
          {loading ? (
            <div className={styles["loading"]}>문의 목록을 불러오는 중...</div>
          ) : error ? (
            <div className={styles["error"]}>{error}</div>
          ) : filteredInquiries.length === 0 ? (
            <div className={styles["empty"]}>조건에 맞는 문의가 없습니다.</div>
          ) : (
            <div className={styles["inquiry-table"]}>
              <table>
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>제목</th>
                    <th>카테고리</th>
                    <th>상태</th>
                    <th>작성일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inquiry, index) => (
                    <tr key={inquiry.id}>
                      <td>{index + 1}</td>
                      <td className={styles["inquiry-title"]}>
                        {inquiry.title}
                      </td>
                      <td>
                        <span className={styles["category-badge"]}>
                          {getCategoryName(inquiry.category)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles["status-badge"]} ${
                            styles[inquiry.status]
                          }`}
                        >
                          {getStatusName(inquiry.status)}
                        </span>
                      </td>
                      <td>{formatDate(inquiry.created_at)}</td>
                      <td className={styles["action-buttons"]}>
                        <button
                          className={styles["view-btn"]}
                          onClick={() => handleViewDetail(inquiry)}
                          title="상세보기"
                        >
                          <FaEye />
                        </button>
                        {inquiry.status === "pending" && (
                          <button
                            className={styles["answer-btn"]}
                            onClick={() => handleOpenAnswerModal(inquiry)}
                            title="답변하기"
                          >
                            <FaReply />
                          </button>
                        )}
                        {inquiry.status === "answered" && (
                          <button
                            className={styles["close-btn"]}
                            onClick={() =>
                              handleStatusChange(inquiry.id, "closed")
                            }
                            title="완료처리"
                          >
                            <FaCheck />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 문의 상세 모달 */}
      {showDetailModal && selectedInquiry && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <h3>문의 상세</h3>
              <button
                className={styles["close-btn"]}
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles["inquiry-detail"]}>
              <div className={styles["detail-header"]}>
                <h4>{selectedInquiry.title}</h4>
                <span
                  className={`${styles["status-badge"]} ${
                    styles[selectedInquiry.status]
                  }`}
                >
                  {getStatusName(selectedInquiry.status)}
                </span>
              </div>

              <div className={styles["detail-info"]}>
                <span>
                  카테고리: {getCategoryName(selectedInquiry.category)}
                </span>
                <span>작성일: {formatDate(selectedInquiry.created_at)}</span>
              </div>

              <div className={styles["detail-content"]}>
                <h5>문의 내용</h5>
                <div className={styles["content-text"]}>
                  {selectedInquiry.content}
                </div>
              </div>

              {selectedInquiry.answer && (
                <div className={styles["detail-answer"]}>
                  <h5>답변</h5>
                  <div className={styles["answer-text"]}>
                    {selectedInquiry.answer}
                  </div>
                  <div className={styles["answer-date"]}>
                    답변일: {formatDate(selectedInquiry.answered_at)}
                  </div>
                </div>
              )}

              {selectedInquiry.status === "pending" && (
                <div className={styles["detail-actions"]}>
                  <button
                    className={styles["answer-action-btn"]}
                    onClick={() => {
                      setShowDetailModal(false)
                      handleOpenAnswerModal(selectedInquiry)
                    }}
                  >
                    <FaReply /> 답변하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 답변 작성 모달 */}
      {showAnswerModal && selectedInquiry && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <h3>답변 작성</h3>
              <button
                className={styles["close-btn"]}
                onClick={() => setShowAnswerModal(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitAnswer}
              className={styles["answer-form"]}
            >
              <div className={styles["inquiry-summary"]}>
                <h4>{selectedInquiry.title}</h4>
                <div className={styles["inquiry-content"]}>
                  {selectedInquiry.content}
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>답변 내용</label>
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="답변 내용을 입력하세요..."
                  rows={8}
                  required
                />
              </div>

              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  onClick={() => setShowAnswerModal(false)}
                  className={styles["cancel-btn"]}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles["submit-btn"]}
                >
                  {submitting ? "등록 중..." : "답변 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
