// 답변 모달 컴포넌트 (번역 기능 포함)
"use client"
import React, { useState, useCallback } from "react"
import { apiPut, parseJsonResponse } from "../utils/apiHelper"
import styles from "./inquiry-manage.module.css"

export default function AnswerModal({
  isOpen,
  inquiry,
  onClose,
  onAnswerSubmitted,
  showToast,
}) {
  const [answerText, setAnswerText] = useState(inquiry?.answer || "")
  const [submitting, setSubmitting] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState("")
  const [translatedContent, setTranslatedContent] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)

  // 답변 텍스트 초기화
  React.useEffect(() => {
    if (inquiry) {
      setAnswerText(inquiry.answer || "")
      setShowTranslation(false)
      setTranslatedTitle("")
      setTranslatedContent("")
      setIsTranslating(false)
    }
  }, [inquiry])

  // 번역 함수
  const handleTranslate = useCallback(async () => {
    if (!inquiry) return

    setIsTranslating(true)
    setShowTranslation(true)

    try {
      const textsToTranslate = [
        inquiry.title || "제목 없음",
        inquiry.content || "내용 없음",
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
  }, [inquiry])

  const toggleTranslation = useCallback(() => {
    if (showTranslation) {
      setShowTranslation(false)
      setTranslatedTitle("")
      setTranslatedContent("")
    } else {
      handleTranslate()
    }
  }, [showTranslation, handleTranslate])

  // 답변 제출
  const submitAnswer = useCallback(async () => {
    if (!answerText.trim()) {
      alert("답변 내용을 입력해주세요.")
      return
    }

    if (!inquiry) return

    const requestData = {
      inquiry_code:
        inquiry.inquiry_code ||
        `INQ-${String(inquiry.id).padStart(4, "0")}`,
      answer: answerText.trim(),
    }

    setSubmitting(true)
    try {
      const res = await apiPut("/api/inquiry-route", requestData)
      const data = await parseJsonResponse(res)
      if (data.success) {
        showToast("답변이 성공적으로 등록되었습니다.")
        onClose()
        onAnswerSubmitted()
      } else {
        showToast(data.error || "답변 등록에 실패했습니다.")
      }
    } catch (error) {
      showToast("서버 오류가 발생했습니다.")
    }
    setSubmitting(false)
  }, [answerText, inquiry, onClose, onAnswerSubmitted, showToast])

  if (!isOpen || !inquiry) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>문의 답변</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>
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
                className={`${styles.translateBtn} ${
                  showTranslation ? styles.translateBtnActive : ""
                }`}
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
              {inquiry.inquiry_code ||
                `INQ-${String(inquiry.id).padStart(4, "0")}`}
            </p>
            <p>
              <strong>제목:</strong> {inquiry.title || "제목 없음"}
            </p>
            <p>
              <strong>내용:</strong> {inquiry.content || "내용 없음"}
            </p>
            <p>
              <strong>상태:</strong> {inquiry.status || "대기중"}
            </p>

            {/* 번역 결과 표시 */}
            {showTranslation && (
              <div className={styles.translationBox}>
                <h5 className={styles.translationTitle}>한국어 번역</h5>
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
            <h4>{inquiry.answer ? "답변 수정" : "답변 작성"}</h4>
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
            onClick={onClose}
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
  )
}

