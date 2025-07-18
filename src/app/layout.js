"use client"
import { usePathname, useRouter } from "next/navigation"
import Menu from "./components/menu"
import ProfileButton from "./components/profilebutton"
import Script from "next/script"
import { useEffect } from "react"

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const hideMenuAndProfile = pathname === "/login" || pathname === "/signup"

  useEffect(() => {
    const id = localStorage.getItem("id")
    if (!id) return

    // 내부 라우팅(Next.js) 및 새로고침에서 플래그 설정
    const setInternalNavFlag = () =>
      sessionStorage.setItem("internal-nav", "true")
    window.addEventListener("beforeunload", setInternalNavFlag)
    window.addEventListener("popstate", setInternalNavFlag)

    // Next.js App Router: 클라이언트 전용 라우팅 대응
    // (참고: next/navigation에는 router 이벤트가 없으므로 직접 감지)
    // Link, router.push 등으로 이동 시에만 플래그를 남기고 싶은 경우 아래 코드 사용
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
      // 항상 플래그 초기화
      sessionStorage.removeItem("internal-nav")
    }
    window.addEventListener("unload", handleUnload)

    return () => {
      window.removeEventListener("beforeunload", setInternalNavFlag)
      window.removeEventListener("popstate", setInternalNavFlag)
      window.removeEventListener("unload", handleUnload)
      // router.push 복구
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
        {children}
      </body>
    </html>
  )
}
