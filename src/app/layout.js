// app/layout.js (또는 app/page.js)
"use client"
import { useEffect } from "react"

export default function RootLayout({ children }) {
  useEffect(() => {
    const id = localStorage.getItem("id")
    if (!id) return

    const handleUnload = (event) => {
      const nav = performance.getEntriesByType("navigation")[0]
      if (nav && nav.type === "reload") {
        // 새로고침은 무시
        return
      }
      navigator.sendBeacon("/api/logout-route", JSON.stringify({ id }))
    }

    window.addEventListener("unload", handleUnload)
    return () => window.removeEventListener("unload", handleUnload)
  }, [])

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
