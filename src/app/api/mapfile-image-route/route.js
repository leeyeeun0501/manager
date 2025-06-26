import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return new NextResponse("잘못된 요청", { status: 400 })
  }

  // 외부 이미지 서버에서 이미지 바이너리 fetch
  const imageRes = await fetch(
    `http://13.55.76.216:3000/floor/${encodeURIComponent(
      floor
    )}/${encodeURIComponent(building)}`
  )

  if (!imageRes.ok) {
    return new NextResponse("도면 이미지를 불러올 수 없습니다.", {
      status: 404,
    })
  }

  // 바이너리 스트림 그대로 반환 (Content-Type 유지)
  const contentType = imageRes.headers.get("content-type") || "image/png"
  const arrayBuffer = await imageRes.arrayBuffer()
  return new NextResponse(Buffer.from(arrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${building}_${floor}.png"`,
    },
  })
}

// POST: 위치+카테고리 저장 (변경 없음)
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
    `http://13.55.76.216:3000/category/${encodeURIComponent(
      building
    )}/${encodeURIComponent(floor)}`,
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
