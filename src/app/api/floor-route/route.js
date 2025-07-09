// floor-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 전체 데이터 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")

  // 1. 전체 층 정보 조회 (GET /api/floor-route)
  if (!building) {
    const res = await fetch(`${API_BASE}/floor/`, {
      method: "GET",
      cache: "no-store",
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "전체 층 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    const result = (Array.isArray(data) ? data : []).map((row) => ({
      floor: row.Floor_Number,
      building: row.Building_Name,
      file: row.File || null,
    }))
    return NextResponse.json({ floors: result })
  }

  // 2. 특정 건물의 층 정보 조회 (GET /api/floor-route?building=건물명)
  if (building) {
    const res = await fetch(
      `${API_BASE}/floor/${encodeURIComponent(building)}`,
      { method: "GET", cache: "no-store" }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: "해당 건물의 층 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    const result = (Array.isArray(data) ? data : []).map((row) => ({
      floor: row.Floor_Number,
      building: row.Building_Name,
      file: row.File || null,
    }))
    return NextResponse.json({ floors: result })
  }

  // 3. 그 외 잘못된 요청
  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}
// 층 추가 (POST)
export async function POST(request) {
  const formData = await request.formData()
  const res = await fetch(`${API_BASE}/floor`, {
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
    `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
      building
    )}`,
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

// 층 삭제 (DELETE)
export async function DELETE(request) {
  const { searchParams } = request.nextUrl // ← 수정!
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return NextResponse.json("건물명과 층번호가 필요합니다.", { status: 400 })
  }

  try {
    const res = await fetch(
      `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
        building
      )}`,
      { method: "DELETE" }
    )
    const text = await res.text()
    if (res.status === 200) {
      return new NextResponse("층 삭제 성공", { status: 200 })
    } else if (res.status === 404) {
      return new NextResponse("존재하지 않는 층입니다.", { status: 404 })
    } else {
      return new NextResponse("층 삭제 처리 중 오류", { status: 500 })
    }
  } catch (err) {
    return new NextResponse("층 삭제 처리 중 오류", { status: 500 })
  }
}
