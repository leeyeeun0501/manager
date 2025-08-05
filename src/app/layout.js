// layout.js
"use client"
import { usePathname, useRouter } from "next/navigation"
import Menu from "./components/menu"
import ProfileButton from "./components/profilebutton"
import NotificationButton from "./components/notificationbutton"
import Script from "next/script"
import { useEffect } from "react"

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const hideMenuAndProfile =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/mypage/verify-password"
  const hideNotification =
    pathname === "/inquiry" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/mypage/verify-password"

  useEffect(() => {
    const id = localStorage.getItem("id")
    if (!id) return

    const setInternalNavFlag = () =>
      sessionStorage.setItem("internal-nav", "true")
    window.addEventListener("beforeunload", setInternalNavFlag)
    window.addEventListener("popstate", setInternalNavFlag)

    // 내부 라우팅(Next.js) 및 새로고침에서 플래그 설정
    const originalPush = router.push
    router.push = (...args) => {
      sessionStorage.setItem("internal-nav", "true")
      originalPush.apply(router, args)
    }

    // unload에서만 로그아웃 요청 (플래그 없을 때)
    const handleUnload = () => {
      if (!sessionStorage.getItem("internal-nav")) {
        navigator.sendBeacon("/api/logout-route", JSON.stringify({ id }))
      }
      sessionStorage.removeItem("internal-nav")
    }
    window.addEventListener("unload", handleUnload)

    return () => {
      window.removeEventListener("beforeunload", setInternalNavFlag)
      window.removeEventListener("popstate", setInternalNavFlag)
      window.removeEventListener("unload", handleUnload)
      if (router.push === originalPush) return
      router.push = originalPush
    }
  }, [router])

  return (
    <html lang="ko">
      <body>
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
        {!hideNotification && (
          <div
            style={{
              position: "fixed",
              top: 24,
              right: 80,
              zIndex: 2000,
            }}
          >
            <NotificationButton />
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
