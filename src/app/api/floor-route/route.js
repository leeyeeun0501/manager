// floor-route
import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")

  if (!building) {
    return NextResponse.json({ error: "건물명을 입력하세요." }, { status: 400 })
  }

  // 외부 서버에서 건물별 층 목록+도면(Base64) 조회
  const res = await fetch(
    `http://13.55.76.216:3000/floor/${encodeURIComponent(building)}`,
    { method: "GET" }
  )

  if (!res.ok) {
    return NextResponse.json(
      { error: "층 정보를 불러올 수 없습니다." },
      { status: res.status }
    )
  }

  // [{ floor, building, file(Base64) }, ...] 형태로 반환됨
  const data = await res.json()
  const floors = Array.isArray(data) ? data : []

  // 필요시 클라이언트에 맞게 필드명 매핑
  const result = floors.map((row) => ({
    floor: row.Floor_Number,
    building: row.Building_Name,
    file: row.file || null, // Base64 PNG
  }))

  return NextResponse.json({ floors: result })
}

export async function POST(request) {
  const formData = await request.formData()
  const res = await fetch("http://13.55.76.216:3000/floor", {
    method: "POST",
    body: formData,
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
