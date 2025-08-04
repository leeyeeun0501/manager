// menu
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
      const res = await fetch("/api/logout-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        localStorage.removeItem("userId")
        localStorage.removeItem("userName")
        localStorage.removeItem("islogin")
        sessionStorage.removeItem("passwordVerified")
        setMenuOpen(false)
        router.push("/login")
      } else {
        alert("로그아웃 실패")
      }
    } catch {
      alert("서버 오류로 로그아웃에 실패했습니다.")
    }
  }

  const menuItems = [
    { label: "Home 화면", icon: <FaHome />, path: "/management" },
    { label: "Map 관리", icon: <FaMapMarkedAlt />, path: "/building-manage" },
    { label: "Floor 관리", icon: <FaBuilding />, path: "/floor-manage" },
    { label: "Room 관리", icon: <FaDoorOpen />, path: "/room-manage" },
    { label: "User 관리", icon: <FaUser />, path: "/user-manage" },
    { label: "문의 관리", icon: <FaQuestionCircle />, path: "/inquiry" },
    { label: "마이페이지", icon: <FaUser />, path: "/mypage" },
  ]

  return (
    <>
      {/* 햄버거 아이콘 */}
      {!menuOpen && (
        <div
          onClick={() => setMenuOpen(true)}
          className={styles.bmBurgerButton}
          style={{ cursor: "pointer" }}
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

        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.path}
            className={`${styles.menuLink} ${
              pathname === item.path ? styles.active : ""
            }`}
            onClick={() => setMenuOpen(false)}
            tabIndex={0}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: 12, fontSize: "1.1em" }} />
          로그아웃
        </button>
      </Menu>
    </>
  )
}
