// inquiry(문의 목록)
"use client"
import React, { useEffect, useState } from "react"
import Menu from "../components/menu"
import styles from "../management/management.module.css"
import Image from "next/image"
import "../globals.css"

const CATEGORY_OPTIONS = [
  { value: "all", label: "전체" },
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
    <div className={styles["management-root"]}>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className={styles["management-content"]}>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>
          문의 목록
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 18,
            gap: 12,
          }}
        >
          <label
            htmlFor="category-select"
            style={{ fontWeight: 600, fontSize: 16 }}
          >
            문의 유형
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 15,
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            padding: 24,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f6fa" }}>
                <th style={{ padding: 10, fontWeight: 700, fontSize: 15 }}>
                  ID
                </th>
                <th style={{ padding: 10, fontWeight: 700, fontSize: 15 }}>
                  문의 유형
                </th>
                <th style={{ padding: 10, fontWeight: 700, fontSize: 15 }}>
                  제목
                </th>
                <th style={{ padding: 10, fontWeight: 700, fontSize: 15 }}>
                  내용
                </th>
                <th style={{ padding: 10, fontWeight: 700, fontSize: 15 }}>
                  사진
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                    로딩 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: 32, color: "#888" }}
                  >
                    문의가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((q, idx) => (
                  <tr
                    key={q.id || idx}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {q.id || "-"}
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {CATEGORY_OPTIONS.find(
                        (opt) => opt.value === (q.category || "general")
                      )?.label || "일반"}
                    </td>
                    <td style={{ padding: 10 }}>{q.title}</td>
                    <td style={{ padding: 10 }}>{q.content}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
