import { NextResponse } from "next/server"

// 전체 데이터 조회 (GET)
export async function GET() {
  try {
    const res = await fetch("http://13.55.76.216:3000/room", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "강의실 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    const rooms = Array.isArray(data)
      ? data.map((room) => ({
          building: room.Building_Name,
          floor: room.Floor_Number,
          name: room.Room_Name,
          description: room.Room_Description,
        }))
      : []
    return NextResponse.json({ rooms })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}
