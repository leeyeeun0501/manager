// building-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 전체 데이터 조회/건물 이름만 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)

  // 건물 이름만 조회
  if (searchParams.get("type") === "names") {
    const res = await fetch(`${API_BASE}/building/names`, {
      method: "GET",
    })
    const data = await res.json()
    return NextResponse.json({ names: data })
  }

  // 전체 데이터 조회
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building && !floor) {
    const res = await fetch(`${API_BASE}/building`, {
      method: "GET",
    })
    const data = await res.json()
    const mapped = (Array.isArray(data) ? data : []).map((b) => ({
      ...b,
      image: b.image || b.image_url || b.File || null,
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

  console.log("받은 FormData 키들:")
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, typeof value === "object" ? value.name : value)
  }

  // 배열 인덱스로 이미지들 가져오기
  const images = []
  let index = 0
  while (formData.get(`images[${index}]`)) {
    const image = formData.get(`images[${index}]`)
    console.log(`이미지 ${index} 받음:`, image.name)
    images.push(image)
    index++
  }

  // 추가: images 키로도 확인
  const imagesAlt = formData.getAll("images")
  console.log("images 키로 받은 이미지들:", imagesAlt.length)
  if (imagesAlt.length > 0) {
    imagesAlt.forEach((image, idx) => {
      console.log(`images[${idx}] 받음:`, image.name)
      if (!images.find((img) => img.name === image.name)) {
        images.push(image)
      }
    })
  }

  console.log("총 이미지 개수:", images.length)
  const desc = formData.get("desc")
  console.log("설명:", desc)

  if (!file && !desc && (!images || images.length === 0)) {
    return NextResponse.json(
      { error: "수정할 항목이 없습니다." },
      { status: 400 }
    )
  }

  const externalForm = new FormData()
  if (file) externalForm.append("file", file)
  if (images && images.length > 0) {
    // 모든 이미지를 외부 API로 전송
    images.forEach((image, index) => {
      console.log(`외부 API로 이미지 ${index} 전송:`, image.name)
      externalForm.append(`images[${index}]`, image)
    })
  }
  if (desc) externalForm.append("desc", desc)

  console.log(
    "외부 API URL:",
    `${API_BASE}/building/${encodeURIComponent(building)}`
  )
  const res = await fetch(
    `${API_BASE}/building/${encodeURIComponent(building)}`,
    { method: "PUT", body: externalForm }
  )

  console.log("외부 API 응답 상태:", res.status)
  const text = await res.text()
  console.log("외부 API 응답 텍스트:", text)

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

    const res = await fetch(`${API_BASE}/building/`, {
      method: "POST",
      body: externalForm,
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
    const url = `${API_BASE}/building/${encodeURIComponent(building_name)}`
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
