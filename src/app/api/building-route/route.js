// building-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 건물 전체 데이터 조회/건물 이름만 조회 (GET)
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

  // 배열 인덱스로 이미지들 가져오기
  const images = []
  let index = 0
  while (formData.get(`images[${index}]`)) {
    const image = formData.get(`images[${index}]`)
    images.push(image)
    index++
  }

  // 추가: images 키로도 확인 ??????
  const imagesAlt = formData.getAll("images")
  if (imagesAlt.length > 0) {
    imagesAlt.forEach((image, idx) => {
      if (!images.find((img) => img.name === image.name)) {
        images.push(image)
      }
    })
  }

  const desc = formData.get("desc")

  if (!file && !desc && (!images || images.length === 0)) {
    return NextResponse.json(
      { error: "수정할 항목이 없습니다." },
      { status: 400 }
    )
  }

  const externalForm = new FormData()
  if (file) externalForm.append("file", file)
  if (images && images.length > 0) {
    images.forEach((image, index) => {
      externalForm.append(`images[${index}]`, image)
    })
  }
  if (desc) externalForm.append("desc", desc)

  const res = await fetch(
    `${API_BASE}/building/${encodeURIComponent(building)}`,
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
