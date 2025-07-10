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

  const imageRes = await fetch(
    `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
      building
    )}`
  )

  if (!imageRes.ok) {
    return new NextResponse("도면 이미지를 불러올 수 없습니다.", {
      status: 404,
    })
  }

  const contentType = imageRes.headers.get("content-type") || "image/png"
  const arrayBuffer = await imageRes.arrayBuffer()
  if (
    contentType.includes("svg") ||
    contentType.includes("xml") ||
    contentType.startsWith("text/")
  ) {
    const text = new TextDecoder("utf-8").decode(arrayBuffer)
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": contentType },
    })
  } else {
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: { "Content-Type": contentType },
    })
  }
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
