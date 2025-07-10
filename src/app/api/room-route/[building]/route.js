// room-route/[building]
import { NextResponse } from "next/server"
import { API_BASE } from "../../apibase"

// 강의실 조회(건물) (GET)
export async function GET(request, { params }) {
  const { building } = params

  try {
    const url = `${API_BASE}/room/${encodeURIComponent(building)}`
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
