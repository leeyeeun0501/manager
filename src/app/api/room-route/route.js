// room-route
import { NextResponse } from "next/server"

// 강의실 전체 조회 (GET)
export async function GET() {
  try {
    // 외부 서버에서 강의실(방) 목록 받아오기
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

    // 예시 반환값: [{ Building_Name, Floor_Number, Room_Name, Room_Description }, ...]
    const data = await res.json()

    // 프론트엔드에서 쓰기 좋은 형태로 필드명 매핑
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
