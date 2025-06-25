"use client"
import { slide as Menu } from "react-burger-menu"
import Image from "next/image"
import { FaBars } from "react-icons/fa"
import Link from "next/link"
import React from "react"
import { useRouter } from "next/navigation"
import "./menu.css" // 스타일 파일 import

export default function HamburgerMenu({ menuOpen, setMenuOpen }) {
  const router = useRouter()

  // 로그아웃 핸들러: 서버에 로그아웃 요청 후 localStorage 정리
  const handleLogout = async () => {
    const id = localStorage.getItem("id")
    try {
      const res = await fetch("/api/logout-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        localStorage.removeItem("id")
        localStorage.removeItem("name")
        localStorage.removeItem("islogin")
        setMenuOpen(false)
        router.push("/login")
      } else {
        alert("로그아웃 실패")
      }
    } catch (err) {
      alert("서버 오류로 로그아웃에 실패했습니다.")
    }
  }

  return (
    <>
      {/* 햄버거 아이콘 */}
      <FaBars
        size={28}
        onClick={() => setMenuOpen(true)}
        className="bm-burger-button"
        style={{ cursor: "pointer" }}
      />
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        customBurgerIcon={false}
        width={300}
        className="bm-menu-wrap"
        overlayClassName="bm-overlay"
        menuClassName="bm-menu"
        itemListClassName="bm-item-list"
      >
        <div className="menu-profile">
          <Image
            src="/profile.png"
            alt="프로필"
            width={80}
            height={80}
            className="profile-img"
            priority
          />
          <div className="profile-name">홍길동</div>
        </div>
        <Link
          href="/management"
          className="menu-link"
          onClick={() => setMenuOpen(false)}
        >
          홈 화면
        </Link>
        <Link
          href="/building-manage"
          className="menu-link"
          onClick={() => setMenuOpen(false)}
        >
          건물 관리
        </Link>
        <Link
          href="/mapfile-manage"
          className="menu-link"
          onClick={() => setMenuOpen(false)}
        >
          맵 파일 관리
        </Link>
        <Link
          href="/user-manage"
          className="menu-link"
          onClick={() => setMenuOpen(false)}
        >
          사용자 관리
        </Link>
        {/* 로그아웃 버튼 */}
        <button
          className="menu-link"
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
            padding: 0,
            marginTop: 16,
          }}
        >
          로그아웃
        </button>
      </Menu>
    </>
  )
}
