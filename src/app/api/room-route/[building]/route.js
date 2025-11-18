// 건물-강의실 요청 API
import { NextResponse } from "next/server"
import { API_BASE } from "../../apibase"
import { verifyToken } from "../../../utils/authHelper"

// 강의실 조회(건물) (GET)
export async function GET(request, { params }) {
  const { building } = await params

  try {
    // 토큰 검증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const url = `${API_BASE}/room/${encodeURIComponent(building)}`
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

