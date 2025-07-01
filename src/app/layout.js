// app/layout.js
"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Menu from "./components/menu"
import ProfileButton from "./components/profilebutton"
import Script from "next/script" // 추가!

export default function RootLayout({ children }) {
  const pathname = usePathname()

  const hideMenuAndProfile = pathname === "/login" || pathname === "/signup"

  useEffect(() => {
    const id = localStorage.getItem("id")
    if (!id) return

    const handleUnload = (event) => {
      const nav = performance.getEntriesByType("navigation")[0]
      if (nav && nav.type === "reload") {
        return
      }
      navigator.sendBeacon("/api/logout-route", JSON.stringify({ id }))
    }

    window.addEventListener("unload", handleUnload)
    return () => window.removeEventListener("unload", handleUnload)
  }, [])

  return (
    <html lang="ko">
      <body>
        {/* 네이버 지도 API 스크립트 전역 추가 */}
        <Script
          src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=yxffktqahm"
          strategy="beforeInteractive"
        />
        {!hideMenuAndProfile && (
          <>
            <div
              style={{
                position: "fixed",
                top: 24,
                right: 32,
                zIndex: 2000,
              }}
            >
              <ProfileButton />
            </div>
            <Menu />
          </>
        )}
        {children}
      </body>
    </html>
  )
}
