// building-route
import { NextResponse } from "next/server"

// 전체 데이터 조회 + 건물 이름만 조회 (GET)
export async function GET(request) {
  const { searchParams, pathname } = new URL(request.url)

  // 1. 건물 이름만 조회 (GET /api/building-route?type=names)
  if (searchParams.get("type") === "names") {
    const res = await fetch("http://13.55.76.216:3000/building/names", {
      method: "GET",
    })
    const data = await res.json()
    // [{ Building_Name: "W19" }, ...] 형태로 반환
    return NextResponse.json({ names: data })
  }

  // 2. 전체 데이터 조회 (GET /api/building-route)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building && !floor) {
    const res = await fetch("http://13.55.76.216:3000/building", {
      method: "GET",
    })
    const data = await res.json()
    const mapped = (Array.isArray(data) ? data : []).map((b) => ({
      ...b,
      file: b.File || null,
    }))
    return NextResponse.json({ all: mapped })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}
// 건물 설명/맵 파일 수정 (PUT)
export async function PUT(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")

  if (!building) {
    return NextResponse.json(
      { error: "building은 필수입니다." },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const desc = formData.get("desc")

  if (!file && !desc) {
    return NextResponse.json(
      { error: "수정할 항목이 없습니다." },
      { status: 400 }
    )
  }

  const externalForm = new FormData()
  if (file) externalForm.append("file", file)
  if (desc) externalForm.append("desc", desc)
  const res = await fetch(
    `http://13.55.76.216:3000/building/${encodeURIComponent(building)}`,
    { method: "PUT", body: externalForm }
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

// 건물 추가 (POST)
export async function POST(request) {
  try {
    const formData = await request.formData()
    const building_name = formData.get("building_name")
    const x = formData.get("x")
    const y = formData.get("y")
    const desc = formData.get("desc")
    const file = formData.get("file")

    if (
      !building_name ||
      x === undefined ||
      y === undefined ||
      isNaN(Number(x)) ||
      isNaN(Number(y))
    ) {
      return NextResponse.json(
        { success: false, error: "건물 이름, 위도, 경도는 필수입니다." },
        { status: 400 }
      )
    }

    const externalForm = new FormData()
    externalForm.append("building_name", building_name)
    externalForm.append("x", x)
    externalForm.append("y", y)
    externalForm.append("desc", desc || "")
    if (file) externalForm.append("file", file)

    const res = await fetch("http://13.55.76.216:3000/building/", {
      method: "POST",
      body: externalForm,
      // Content-Type 헤더는 지정하지 마세요! (자동 처리됨)
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true, building: data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 건물 삭제 (DELETE)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const building_name = searchParams.get("building_name")

  if (!building_name) {
    return NextResponse.json("건물명이 필요합니다.", { status: 400 })
  }

  try {
    const url = `http://13.55.76.216:3000/building/${encodeURIComponent(
      building_name
    )}`
    const res = await fetch(url, { method: "DELETE" })

    if (res.status === 200) {
      return new NextResponse("건물 삭제 성공", { status: 200 })
    } else if (res.status === 404) {
      return new NextResponse("존재하지 않는 건물입니다.", { status: 404 })
    } else {
      return new NextResponse("건물 삭제 처리 중 오류", { status: 500 })
    }
  } catch (err) {
    return new NextResponse("건물 삭제 처리 중 오류", { status: 500 })
  }
}
