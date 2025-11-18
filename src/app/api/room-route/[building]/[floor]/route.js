// 건물-층-강의실 요청 API
import { NextResponse } from "next/server"
import { API_BASE } from "../../../apibase"
import { verifyToken } from "../../../../utils/authHelper"

// 강의실 조회(건물 + 층) (GET)
export async function GET(request, { params }) {
  const { building, floor } = await params

  try {
    // 토큰 검증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const url = `${API_BASE}/room/${encodeURIComponent(
      building
    )}/${encodeURIComponent(floor)}`
    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error || "강의실 조회 실패" },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 수정 (PUT)
export async function PUT(req, context) {
  // 토큰 검증
  const token = verifyToken(req)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  const params = (await context.params) ?? {}
  const { building, floor } = params

  try {
    const body = await req.json()
    const { room_name, room_desc, room_user, user_phone, user_email } = body

    if (!room_name) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 })
    }

    const updateBody = { room_name }
    if (room_desc !== undefined) updateBody.room_desc = room_desc
    if (room_user !== undefined) updateBody.room_user = room_user
    if (user_phone !== undefined) updateBody.user_phone = user_phone
    if (user_email !== undefined) updateBody.user_email = user_email

    const res = await fetch(
      `${API_BASE}/room/${encodeURIComponent(building)}/${encodeURIComponent(
        floor
      )}`,
      {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateBody),
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

    // 성공 응답 처리
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({
      message: data.message || "강의실 정보가 수정되었습니다",
    })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 강의실 추가 (POST)
// 못 씀
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

// 강의실 삭제 (DELETE)
// 못 씀
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
