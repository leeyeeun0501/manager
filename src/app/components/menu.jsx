// 메뉴
"use client"
import { slide as Menu } from "react-burger-menu"
import {
  FaBars,
  FaHome,
  FaMapMarkedAlt,
  FaBuilding,
  FaDoorOpen,
  FaUser,
  FaSignOutAlt,
  FaUserCircle,
  FaQuestionCircle,
} from "react-icons/fa"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiPost, parseJsonResponse } from "../utils/apiHelper"
import styles from "./menu.module.css"

export default function HamburgerMenu({ menuOpen, setMenuOpen }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState("")

  // 사용자 이름 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserName(localStorage.getItem("userName") || "")
    }
  }, [menuOpen])

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const id = localStorage.getItem("userId")
    try {
      const res = await apiPost("/api/logout-route", { id })
      const data = await parseJsonResponse(res)
      if (data.success) {
        localStorage.removeItem("userId")
        localStorage.removeItem("userName")
        localStorage.removeItem("islogin")
        localStorage.removeItem("token")
        sessionStorage.removeItem("passwordVerified")
        setMenuOpen(false)
        router.push("/login")
      } else {
        alert("로그아웃 실패")
      }
    } catch (error) {
      alert(error.message || "서버 오류로 로그아웃에 실패했습니다.")
    }
  }

  const menuItems = [
    { label: "Home", icon: <FaHome />, path: "/management" },
    { label: "Map 관리", icon: <FaMapMarkedAlt />, path: "/building-manage" },
    { label: "Floor 관리", icon: <FaBuilding />, path: "/floor-manage" },
    { label: "Room 관리", icon: <FaDoorOpen />, path: "/room-manage" },
    { label: "User 관리", icon: <FaUser />, path: "/user-manage" },
    { label: "Inquiry 관리", icon: <FaQuestionCircle />, path: "/inquiry" },
    { label: "My Page", icon: <FaUser />, path: "/mypage/verify-password" },
  ]

  return (
    <>
      {/* 햄버거 아이콘 */}
      {!menuOpen && (
        <div
          onClick={() => setMenuOpen(true)}
          className={styles.bmBurgerButton} /* cursor: pointer 스타일은 .bmBurgerButton 클래스에 추가됨 */
          aria-label="메뉴 열기"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setMenuOpen(true)}
        >
          <FaBars size={32} />
        </div>
      )}

      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        customBurgerIcon={false}
        width={260}
        className={styles.bmMenuWrap}
        overlayClassName={styles.bmOverlay}
        menuClassName={styles.bmMenu}
        itemListClassName={styles.menuList}
      >
        <div className={styles.menuProfile}>
          <FaUserCircle
            size={64}
            color="#b0b0b0"
            className={styles.profileImg}
          />
          <div className={styles.profileName}>{userName}</div>
          <div className={styles.profileRole}>관리자</div>
        </div>

        {menuItems.map((item) => {
          const isActive = item.label === "My Page" 
            ? pathname.startsWith("/mypage")
            : item.label === "Room 관리"
            ? pathname.startsWith("/room-manage")
            : pathname === item.path;
          
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`${styles.menuLink} ${isActive ? styles.active : ""}`}
              onClick={() => setMenuOpen(false)}
              tabIndex={0}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <FaSignOutAlt className={styles.logoutIcon} />
          로그아웃
        </button>
      </Menu>
    </>
  )
}
