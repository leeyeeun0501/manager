// menu components
"use client"
import { slide as Menu } from "react-burger-menu"
import Image from "next/image"
import { FaBars } from "react-icons/fa"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./menu.module.css"

export default function HamburgerMenu({ menuOpen, setMenuOpen }) {
  const router = useRouter()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserName(localStorage.getItem("name") || "")
    }
  }, [menuOpen])

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
      <div
        onClick={() => setMenuOpen(true)}
        className={styles.bmBurgerButton}
        style={{ cursor: "pointer" }}
      >
        <FaBars size={32} />
      </div>
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        customBurgerIcon={false}
        width={300}
        className={styles.bmMenuWrap}
        overlayClassName={styles.bmOverlay}
        menuClassName={styles.bmMenu}
        itemListClassName={styles.bmItemList}
      >
        <div className={styles.menuProfile}>
          <Image
            src="/default-profile.png"
            width={80}
            height={80}
            alt="프로필"
            className={styles.profileImg}
          />
          <div className={styles.profileName}>
            {userName || "로그인 사용자"}
          </div>
        </div>
        <Link
          href="/management"
          className={styles.menuLink}
          onClick={() => setMenuOpen(false)}
        >
          Home 화면
        </Link>
        <Link
          href="/tower-manage"
          className={styles.menuLink}
          onClick={() => setMenuOpen(false)}
        >
          Map 관리
        </Link>
        <Link
          href="/building-manage"
          className={styles.menuLink}
          onClick={() => setMenuOpen(false)}
        >
          Floor 관리
        </Link>
        <Link
          href="/room-manage"
          className={styles.menuLink}
          onClick={() => setMenuOpen(false)}
        >
          Room 관리
        </Link>
        <Link
          href="/mapfile-manage"
          className={styles.menuLink}
          onClick={() => setMenuOpen(false)}
        >
          Category 관리
        </Link>
        <Link
          href="/user-manage"
          className={styles.menuLink}
          onClick={() => setMenuOpen(false)}
        >
          User 관리
        </Link>
        <button onClick={handleLogout} className={styles.menuLink}>
          로그아웃
        </button>
      </Menu>
    </>
  )
}
