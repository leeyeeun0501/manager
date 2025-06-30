// room-route
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

// 강의실 삭제 (DELETE)
export async function DELETE(request, { params }) {
  try {
    // params에서 building, floor를 받음 (Next.js app router 기준)
    const { building, floor } = params
    const { room_name } = await request.json() // body에서 room_name 추출

    if (!building || !floor || !room_name) {
      return NextResponse.json("필수 정보가 누락되었습니다.", { status: 400 })
    }

    // 외부 서버에 DELETE 요청
    const url = `http://13.55.76.216:3000/${encodeURIComponent(
      building
    )}/${encodeURIComponent(floor)}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_name }), // body에 room_name 포함
    })

    if (res.status === 200) {
      return NextResponse.json("방 삭제 성공", { status: 200 })
    } else if (res.status === 404) {
      return NextResponse.json("존재하지 않는 건물/층/방입니다.", {
        status: 404,
      })
    } else {
      return NextResponse.json("방 삭제 처리 중 오류", { status: 500 })
    }
  } catch (err) {
    return NextResponse.json("방 삭제 처리 중 오류", { status: 500 })
  }
}
