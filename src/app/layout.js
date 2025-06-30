// app/layout.js
"use client"
import { useEffect } from "react"
import Menu from "./components/menu"
import ProfileButton from "./components/profilebutton"

export default function RootLayout({ children }) {
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
        {children}
      </body>
    </html>
  )
}
