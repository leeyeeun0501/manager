import { NextResponse } from "next/server"

// 임시 데이터 예시
let buildingData = {
  W1: "W1 건물 설명입니다.",
  W2: "W2 건물 설명입니다.",
}
let buildingFloors = {
  W1: [1, 2, 3],
  W2: [1, 2],
}
let classroomData = {
  W1: {
    1: [
      { name: "101호", desc: "1층 첫번째 강의실" },
      { name: "102호", desc: "1층 두번째 강의실" },
    ],
    2: [{ name: "201호", desc: "2층 첫번째 강의실" }],
    3: [{ name: "301호", desc: "3층 강의실" }],
  },
  W2: {
    1: [{ name: "A-101", desc: "W2 1층" }],
    2: [{ name: "A-201", desc: "W2 2층" }],
  },
}

// GET: 건물, 층, 강의실, 전체 데이터 조회
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  // 아무 검색도 없으면 전체 데이터 반환
  if (!building && !floor) {
    const result = []
    for (const bName in buildingFloors) {
      const floors = buildingFloors[bName]
      for (const f of floors) {
        const classrooms = classroomData[bName]?.[f] || []
        for (const room of classrooms) {
          result.push({
            building: bName,
            floor: f,
            name: room.name,
            desc: room.desc,
          })
        }
      }
    }
    return NextResponse.json({ all: result })
  }

  // 건물만 있으면 해당 건물의 층 목록 반환
  if (building && !floor) {
    return NextResponse.json({ floors: buildingFloors[building] || [] })
  }

  // 건물과 층이 있으면 해당 층의 강의실 목록 반환
  if (building && floor) {
    return NextResponse.json({
      classrooms: classroomData[building]?.[floor] || [],
    })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
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
