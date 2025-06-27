// management (메인 화면)
"use client"
import React, { useState } from "react"
import Menu from "../components/menu"
import "./management.css"

export default function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  // 임시 데이터 (실제 데이터 연동 시 API로 대체)
  const summary = {
    building: 5,
    classroom: 32,
    user: 120,
  }

  return (
    <div className="management-root">
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className={`management-content${menuOpen ? " menu-open" : ""}`}>
        <div className="dashboard-summary-row">
          <div className="dashboard-summary-box">
            <div className="summary-label">총 건물 수</div>
            <div className="summary-value">{summary.building}</div>
          </div>
          <div className="dashboard-summary-box">
            <div className="summary-label">총 강의실 수</div>
            <div className="summary-value">{summary.classroom}</div>
          </div>
          <div className="dashboard-summary-box">
            <div className="summary-label">등록 사용자</div>
            <div className="summary-value">{summary.user}</div>
          </div>
        </div>
        <div className="dashboard-section">
          <h3>최근 활동</h3>
          <ul className="dashboard-list">
            <li>2025-06-23 | 강의실 A-101 정보 수정</li>
            <li>2025-06-22 | 건물2 추가</li>
            <li>2025-06-21 | 사용자 홍길동 계정 생성</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
