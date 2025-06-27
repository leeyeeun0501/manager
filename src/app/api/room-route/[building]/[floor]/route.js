// room-route/building/floor/
import { NextResponse } from "next/server"

export async function POST(req, { params }) {
  const { building, floor } = params
  try {
    const body = await req.json()
    const { room_name, room_desc, x, y } = body

    if (!room_name || typeof x === "undefined" || typeof y === "undefined") {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 })
    }

    const res = await fetch(
      `http://13.55.76.216:3000/room/${encodeURIComponent(
        building
      )}/${encodeURIComponent(floor)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_name,
          room_desc,
          x,
          y,
        }),
      }
    )

    if (!res.ok) {
      let data = {}
      try {
        data = await res.json()
      } catch {}
      return NextResponse.json(
        { error: data.error || "DB 오류" },
        { status: 500 }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json({
      message: data.message || "방 추가가 완료되었습니다",
    })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  const { building, floor } = params
  try {
    const body = await req.json()
    const { old_room_name, room_name, room_desc } = body

    if (!old_room_name || !room_name) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 })
    }

    // 외부 서버로 PUT 요청 (기존 강의실명 포함)
    const res = await fetch(
      `http://13.55.76.216:3000/room/${encodeURIComponent(
        building
      )}/${encodeURIComponent(floor)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_room_name, // 기존 강의실명
          room_name, // 수정된 강의실명
          room_desc, // 수정된 설명
        }),
      }
    )

    if (!res.ok) {
      let data = {}
      try {
        data = await res.json()
      } catch {}
      return NextResponse.json(
        { error: data.error || "DB 오류" },
        { status: 500 }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json({
      message: data.message || "수정이 완료되었습니다",
    })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}
