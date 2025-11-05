// 문의 테이블 컴포넌트
"use client"
import React from "react"
import Image from "next/image"
import { FaRegCommentDots } from "react-icons/fa"
import { truncateText } from "../utils/apiHelper"
import styles from "./inquiry-manage.module.css"

export default function InquiryTable({ inquiries, onAnswerClick, onImageClick }) {
  if (inquiries.length === 0) {
    return (
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
          <tr>
            <td colSpan={8} className={styles.noInquiries}>
              문의가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  return (
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
        {inquiries.map((q, idx) => (
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
                  className={styles.inquiryImage}
                  onClick={() => onImageClick(q.image_url)}
                />
              ) : (
                <span className={styles.noImageText}>사진 없음</span>
              )}
            </td>
            <td>{q.status || "대기중"}</td>
            <td style={{ textAlign: "center" }}>
              <button
                className={styles.answerBtn}
                onClick={() => onAnswerClick(q)}
                title="답변 작성"
              >
                <FaRegCommentDots />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

