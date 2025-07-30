// inquiry(문의 목록)
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
  }, [])

  // 페이징
  useEffect(() => {
    localStorage.setItem("INQUIRY_MANAGE_PAGE", currentPage)
  }, [currentPage])

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inquiry-route")
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch {
      setInquiries([])
    }
    setLoading(false)
  }

  // 카테고리 필터링
  const filtered =
    category === "all"
      ? inquiries
      : inquiries.filter((q) => (q.category || "general") === category)

  // 페이징 처리
  const totalInquiries = filtered.length
  const totalPages = Math.ceil(totalInquiries / itemsPerPage)
  const pagedInquiries = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className={styles.inquiryRoot}>
      <span className={styles.inquiryHeader}>문의 관리 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={styles.inquiryContent}>
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
                  <th>ID</th>
                  <th>문의 코드</th>
                  <th>문의 유형</th>
                  <th>제목</th>
                  <th>내용</th>
                  <th>사진</th>
                  <th>상태</th>
                  <th>관리</th>
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
                    <tr key={q.id || idx}>
                      <td>{q.id || "-"}</td>
                      <td>
                        {q.inquiry_code ||
                          `INQ-${String(q.id || idx).padStart(4, "0")}`}
                      </td>
                      <td>
                        {CATEGORY_OPTIONS.find(
                          (opt) => opt.value === (q.category || "general")
                        )?.label || "일반"}
                      </td>
                      <td>{q.title || "제목 없음"}</td>
                      <td>{q.content || "내용 없음"}</td>
                      <td>
                        <Image
                          src={q.image_url || "/file.svg"}
                          alt="문의 사진"
                          width={48}
                          height={48}
                          style={{
                            borderRadius: 8,
                            objectFit: "cover",
                            background: "#f5f6fa",
                          }}
                        />
                      </td>
                      <td>{q.status || "대기중"}</td>
                      <td>
                        <button
                          className={styles.replyBtn}
                          onClick={() => {}}
                          title="답변"
                        >
                          답변
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
                {currentPage} / {totalPages || 1}
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
    </div>
  )
}
