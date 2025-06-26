import { NextResponse } from "next/server"

// 전체 데이터 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building && !floor) {
    const res = await fetch("http://13.55.76.216:3000/building", {
      method: "GET",
    })
    const data = await res.json()
    return NextResponse.json({ all: data })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}

// 건물 이름/설명 수정 (PATCH)
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
  const desc = formData.get("decs") || formData.get("desc")

  if (!desc) {
    return NextResponse.json(
      { error: "수정할 설명을 입력하세요." },
      { status: 400 }
    )
  }

  const externalForm = new FormData()
  externalForm.append("decs", desc)

  const res = await fetch(
    `http://13.55.76.216:3000/building/${encodeURIComponent(building)}`,
    {
      method: "PUT",
      body: externalForm,
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

// 건물 추가 (POST)
export async function POST(request) {
  try {
    const body = await request.json()
    const { building_name, x, y, desc } = body

    // desc는 필수값이 아니면 조건에서 제외
    if (
      !building_name ||
      x === undefined ||
      y === undefined ||
      typeof x !== "number" ||
      typeof y !== "number" ||
      isNaN(x) ||
      isNaN(y)
    ) {
      return NextResponse.json(
        { success: false, error: "건물 이름, 위도, 경도는 필수입니다." },
        { status: 400 }
      )
    }
    const res = await fetch("http://13.55.76.216:3000/building/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building_name,
        x,
        y,
        desc: desc || "",
        // 3D 단면도 파일은 일단 제외
      }),
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
