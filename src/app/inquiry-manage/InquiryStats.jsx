// 문의 통계 컴포넌트
"use client"
import React from "react"
import styles from "./inquiry-manage.module.css"

export default function InquiryStats({ stats }) {
  return (
    <div className={styles.inquiryStatsContainer}>
      <div className={styles.inquiryStatsBox}>
        <div className={styles.statsLabel}>전체</div>
        <div className={styles.statsValue}>{stats.total}</div>
      </div>
      <div className={styles.inquiryStatsBox}>
        <div className={styles.statsLabel}>대기중</div>
        <div className={styles.statsValue}>{stats.pending}</div>
      </div>
      <div className={styles.inquiryStatsBox}>
        <div className={styles.statsLabel}>답변완료</div>
        <div className={styles.statsValue}>{stats.answered}</div>
      </div>
      <div className={styles.inquiryStatsBox}>
        <div className={styles.statsLabel}>답변율</div>
        <div className={styles.statsValue}>{stats.answerRate}%</div>
      </div>
    </div>
  )
}

