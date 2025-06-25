// floor-route
import { NextResponse } from "next/server"

export async function POST(request) {
  const formData = await request.formData()
  // formData를 그대로 외부 서버에 프록시
  const res = await fetch("http://13.55.76.216:3000/floor", {
    method: "POST",
    body: formData,
    // Content-Type 헤더 직접 지정 금지!
  })

  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: "외부 서버 응답이 올바른 JSON이 아닙니다." }
    }
  }

  if (!res.ok) {
    console.error("외부 서버 응답:", data)
    return NextResponse.json(
      { success: false, error: data.error || "외부 서버 오류" },
      { status: res.status }
    )
  }

  return NextResponse.json({ success: true, ...data })
}
