// floor-route
import { NextResponse } from "next/server"

// 전체 데이터 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")

  if (!building) {
    return NextResponse.json({ error: "건물명을 입력하세요." }, { status: 400 })
  }

  const res = await fetch(
    `http://13.55.76.216:3000/floor/${encodeURIComponent(building)}`,
    { method: "GET", cache: "no-store" }
  )

  if (!res.ok) {
    return NextResponse.json(
      { error: "층 정보를 불러올 수 없습니다." },
      { status: res.status }
    )
  }

  const data = await res.json()
  const floors = Array.isArray(data) ? data : []

  const result = floors.map((row) => ({
    floor: row.Floor_Number,
    building: row.Building_Name,
    file: row.file || null, // Base64 PNG
  }))

  return NextResponse.json({ floors: result })
}

// 층 추가 (POST)
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

// 층 맵 파일 수정 (PUT)
export async function PUT(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return NextResponse.json(
      { error: "floor_number와 building_name은 필수입니다." },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  const externalFormData = new FormData()
  externalFormData.append("file", file)
  externalFormData.append("building_name", building)
  externalFormData.append("floor_number", floor)

  const res = await fetch(
    `http://13.55.76.216:3000/floor/${encodeURIComponent(
      floor
    )}/${encodeURIComponent(building)}`,
    {
      method: "PUT",
      body: externalFormData,
    }
  )

  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error || data.message || "건물정보 수정 중 오류" },
      { status: res.status }
    )
  }

  return NextResponse.json(data)
}
