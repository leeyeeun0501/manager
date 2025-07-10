//mapfile-image-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 전체 데이터 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return new Response(JSON.stringify({ error: "잘못된 요청" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // SVG 파일의 URL을 조합 (예시: /your-api-base/W19_1.svg)
  const svgUrl = `${API_BASE}/floor/${encodeURIComponent(
    floor
  )}/${encodeURIComponent(building)}`
  const svgRes = await fetch(svgUrl)
  if (!svgRes.ok) {
    return new Response(
      JSON.stringify({ error: "SVG 파일을 불러올 수 없습니다." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  // SVG 파일을 텍스트로 읽어서 반환
  const svgText = await svgRes.text()
  return new Response(svgText, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  })
}

// 카테고리 추가 (POST)
export async function POST(request) {
  const body = await request.json()
  const { building, floor, category, x, y } = body

  if (
    !building ||
    !floor ||
    !category ||
    typeof x !== "number" ||
    typeof y !== "number"
  ) {
    return NextResponse.json(
      { success: false, error: "필수 항목 누락" },
      { status: 400 }
    )
  }

  const res = await fetch(
    `${API_BASE}/category/${encodeURIComponent(building)}/${encodeURIComponent(
      floor
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, x, y }),
    }
  )

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      { success: false, error: data.error || "외부 서버 오류" },
      { status: res.status }
    )
  }

  return NextResponse.json({ success: true })
}
