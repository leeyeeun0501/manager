import { NextResponse } from "next/server"

// 전체 데이터 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  // 전체 데이터
  if (!building && !floor) {
    // 실제 서버에서 전체 데이터 받아오기
    const res = await fetch("http://13.55.76.216:3000/buildings", {
      method: "GET",
    })
    const data = await res.json()
    return NextResponse.json({ all: data }) // [{building, floor, name, desc, ...}, ...]
  }

  // 건물만 있을 때
  if (building && !floor) {
    const res = await fetch(`http://13.55.76.216:3000/buildings/${building}`, {
      method: "GET",
    })
    const data = await res.json()
    // data 구조에 맞게 floors, allRooms 추출
    return NextResponse.json({
      floors: data.floors,
      allRooms: data.rooms, // [{ building, floor, name, desc }, ...]
    })
  }

  // 건물+층 있을 때
  if (building && floor) {
    const res = await fetch(
      `http://13.55.76.216:3000/buildings/${building}/floors/${floor}`,
      { method: "GET" }
    )
    const data = await res.json()
    return NextResponse.json({
      classrooms: data.classrooms || [],
    })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}

// 건물/강의실 설명 수정 (PATCH)
export async function PATCH(request) {
  const body = await request.json()
  // body: { type: "building"|"classroom", building, floor?, name?, desc }
  if (body.type === "building") {
    // 건물 설명 수정
    const res = await fetch(
      `http://13.55.76.216:3000/buildings/${body.building}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desc: body.desc }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "수정 실패" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  }
  if (body.type === "classroom") {
    // 강의실 설명 수정
    const res = await fetch(
      `http://13.55.76.216:3000/buildings/${body.building}/floors/${body.floor}/classrooms/${body.name}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desc: body.desc }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "수정 실패" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  }
  return NextResponse.json(
    { success: false, error: "잘못된 요청" },
    { status: 400 }
  )
}

export async function POST(request) {
  const formData = await request.formData()
  const building = formData.get("building_name")
  const floor = formData.get("floor_number")
  const file = formData.get("file")

  const proxyForm = new FormData()
  proxyForm.append("building_name", building)
  proxyForm.append("floor_number", floor)
  proxyForm.append("file", file)

  const res = await fetch("http://13.55.76.216:3000/floor", {
    method: "POST",
    body: proxyForm,
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
    return NextResponse.json(
      { success: false, error: data.error || "외부 서버 오류" },
      { status: res.status }
    )
  }

  return NextResponse.json({ success: true, ...data })
}
