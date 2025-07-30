// inquiry(문의 목록)
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import Image from "next/image"
import "../globals.css"
import styles from "./inquiry-manage.module.css"

const CATEGORY_OPTIONS = [
  { value: "all", label: "문의 유형 전체" },
  { value: "general", label: "일반" },
  { value: "bug", label: "버그" },
  { value: "feature", label: "기능 요청" },
  { value: "etc", label: "기타" },
]

export default function InquiryPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInquiries()
  }, [])

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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: 32, color: "#888" }}
                  >
                    문의가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((q, idx) => (
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
                        onClick={() => {
                          /* 답변 기능 */
                        }}
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
        )}
      </div>
    </div>
  )
}
