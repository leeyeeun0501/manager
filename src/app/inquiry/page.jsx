// inquiry
"use client"
import "../globals.css"
import React, { useState, useEffect } from "react"
import Menu from "../components/menu"
import styles from "./inquiry.module.css"
import { FaPlus, FaEye, FaReply, FaTrash } from "react-icons/fa"

export default function InquiryPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 모달 상태
  const [showNewInquiryModal, setShowNewInquiryModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)

  // 새 문의 폼 상태
  const [newInquiry, setNewInquiry] = useState({
    title: "",
    content: "",
    category: "general",
  })
  const [submitting, setSubmitting] = useState(false)

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

  // 새 문의 제출
  async function handleSubmitInquiry(e) {
    e.preventDefault()
    if (!newInquiry.title.trim() || !newInquiry.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/inquiry-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInquiry),
      })

      if (!res.ok) throw new Error("문의 등록에 실패했습니다.")

      alert("문의가 성공적으로 등록되었습니다!")
      setShowNewInquiryModal(false)
      setNewInquiry({ title: "", content: "", category: "general" })
      fetchInquiries()
    } catch (err) {
      alert(err.message)
    }
    setSubmitting(false)
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

  // 문의 삭제
  async function handleDeleteInquiry(inquiryId) {
    if (!window.confirm("정말 이 문의를 삭제하시겠습니까?")) return

    try {
      const res = await fetch(`/api/inquiry-route?id=${inquiryId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("문의 삭제에 실패했습니다.")

      alert("문의가 삭제되었습니다.")
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

  return (
    <div className={styles["inquiry-root"]}>
      <span className={styles["inquiry-header"]}>문의 관리</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className={styles["inquiry-content"]}>
        {/* 상단 버튼 */}
        <div className={styles["inquiry-controls"]}>
          <button
            className={styles["new-inquiry-btn"]}
            onClick={() => setShowNewInquiryModal(true)}
          >
            <FaPlus /> 새 문의 작성
          </button>
        </div>

        {/* 문의 목록 */}
        <div className={styles["inquiry-list"]}>
          {loading ? (
            <div className={styles["loading"]}>문의 목록을 불러오는 중...</div>
          ) : error ? (
            <div className={styles["error"]}>{error}</div>
          ) : inquiries.length === 0 ? (
            <div className={styles["empty"]}>등록된 문의가 없습니다.</div>
          ) : (
            <div className={styles["inquiry-grid"]}>
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className={styles["inquiry-card"]}>
                  <div className={styles["inquiry-header"]}>
                    <span className={styles["inquiry-title"]}>
                      {inquiry.title}
                    </span>
                    <span
                      className={`${styles["inquiry-status"]} ${
                        styles[inquiry.status]
                      }`}
                    >
                      {getStatusName(inquiry.status)}
                    </span>
                  </div>

                  <div className={styles["inquiry-info"]}>
                    <span className={styles["inquiry-category"]}>
                      {getCategoryName(inquiry.category)}
                    </span>
                    <span className={styles["inquiry-date"]}>
                      {formatDate(inquiry.created_at)}
                    </span>
                  </div>

                  <div className={styles["inquiry-content-preview"]}>
                    {inquiry.content.length > 100
                      ? inquiry.content.substring(0, 100) + "..."
                      : inquiry.content}
                  </div>

                  <div className={styles["inquiry-actions"]}>
                    <button
                      className={styles["view-btn"]}
                      onClick={() => handleViewDetail(inquiry)}
                    >
                      <FaEye /> 상세보기
                    </button>
                    <button
                      className={styles["delete-btn"]}
                      onClick={() => handleDeleteInquiry(inquiry.id)}
                    >
                      <FaTrash /> 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 새 문의 작성 모달 */}
      {showNewInquiryModal && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <h3>새 문의 작성</h3>
              <button
                className={styles["close-btn"]}
                onClick={() => setShowNewInquiryModal(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitInquiry}
              className={styles["inquiry-form"]}
            >
              <div className={styles["form-group"]}>
                <label>카테고리</label>
                <select
                  value={newInquiry.category}
                  onChange={(e) =>
                    setNewInquiry({ ...newInquiry, category: e.target.value })
                  }
                  required
                >
                  <option value="general">일반</option>
                  <option value="technical">기술</option>
                  <option value="bug">버그</option>
                  <option value="feature">기능요청</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label>제목</label>
                <input
                  type="text"
                  value={newInquiry.title}
                  onChange={(e) =>
                    setNewInquiry({ ...newInquiry, title: e.target.value })
                  }
                  placeholder="문의 제목을 입력하세요"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label>내용</label>
                <textarea
                  value={newInquiry.content}
                  onChange={(e) =>
                    setNewInquiry({ ...newInquiry, content: e.target.value })
                  }
                  placeholder="문의 내용을 상세히 입력하세요"
                  rows={6}
                  required
                />
              </div>

              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  onClick={() => setShowNewInquiryModal(false)}
                  className={styles["cancel-btn"]}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles["submit-btn"]}
                >
                  {submitting ? "등록 중..." : "문의 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
