import { NextResponse } from "next/server"

// GET: 건물 목록, 층 목록, 도면 이미지 URL, 카테고리 목록 반환
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  // 1. 건물 목록
  if (!building) {
    const res = await fetch("http://13.55.76.216:3000/buildings")
    if (!res.ok) return NextResponse.json({ buildings: [] })
    const data = await res.json()
    const buildings = Array.isArray(data)
      ? [...new Set(data.map((row) => row.building || row.name))]
      : []
    return NextResponse.json({ buildings })
  }

  // 2. 층 목록
  if (building && !floor) {
    const res = await fetch(`http://13.55.76.216:3000/buildings/${building}`)
    if (!res.ok) return NextResponse.json({ floors: [] })
    const data = await res.json()
    return NextResponse.json({ floors: data.floors || [] })
  }

  // 3. 도면 이미지 URL + 카테고리 목록
  if (building && floor) {
    // 도면 이미지 URL
    const res = await fetch(
      `http://13.55.76.216:3000/buildings/${building}/floors/${floor}`
    )
    if (!res.ok) return NextResponse.json({ mapUrl: "", categories: [] })
    const data = await res.json()
    // 카테고리 목록도 외부 서버에서 받아온다고 가정 (예: data.categories)
    // 실제 필드명에 맞게 수정 필요
    return NextResponse.json({
      mapUrl: data.mapfileUrl || data.floorImageUrl || "",
      categories: data.categories || [],
    })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}

// POST: 위치+카테고리 저장
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

  // 실제로는 외부 서버에 저장 요청
  const res = await fetch("http://13.55.76.216:3000/mapfile/category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ building, floor, category, x, y }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      { success: false, error: data.error || "외부 서버 오류" },
      { status: res.status }
    )
  }
  return NextResponse.json({ success: true })
}
