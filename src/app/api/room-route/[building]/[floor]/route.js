import { NextResponse } from "next/server"
import { API_BASE } from "../../../../apibase" // 경로 주의!

export async function GET(request, { params }) {
  const { building, floor } = params

  try {
    const url = `${API_BASE}/room/${encodeURIComponent(
      building
    )}/${encodeURIComponent(floor)}`
    const res = await fetch(url)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error || "강의실 조회 실패" },
        { status: res.status }
      )
    }

    const data = await res.json()
    // data.rooms 형태로 반환된다고 가정
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 강의실 추가 (POST)
export async function POST(req, { params }) {
  const { building, floor } = params
  try {
    const body = await req.json()
    const { room_name, room_desc, x, y } = body

    if (!room_name || typeof x === "undefined" || typeof y === "undefined") {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 })
    }

    const res = await fetch(
      `${API_BASE}/room/${encodeURIComponent(building)}/${encodeURIComponent(
        floor
      )}`,
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

// 강의실명/강의실 설명 수정 (PUT)
export async function PUT(req, context) {
  const params = context.params ? await context.params : {}
  const { building, floor } = params
  try {
    const body = await req.json()
    const { old_room_name, room_name, room_desc } = body

    if (!old_room_name || !room_name) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 })
    }

    const res = await fetch(
      `${API_BASE}/room/${encodeURIComponent(building)}/${encodeURIComponent(
        floor
      )}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_room_name,
          room_name,
          room_desc,
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

// 강의실 삭제 (DELETE)
export async function DELETE(request, { params }) {
  const { building, floor } = params
  const { room_name } = await request.json()

  console.log("삭제 요청:", { building, floor, room_name })

  if (!building || !floor || !room_name) {
    return NextResponse.json("필수 정보가 누락되었습니다.", { status: 400 })
  }

  const res = await fetch(
    `${API_BASE}/room/${encodeURIComponent(building)}/${encodeURIComponent(
      floor
    )}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_name }),
    }
  )

  if (res.status === 200) {
    return NextResponse.json("방 삭제 성공", { status: 200 })
  } else if (res.status === 404) {
    return NextResponse.json("존재하지 않는 건물/층/방입니다.", { status: 404 })
  } else {
    return NextResponse.json("방 삭제 처리 중 오류", { status: 500 })
  }
}
