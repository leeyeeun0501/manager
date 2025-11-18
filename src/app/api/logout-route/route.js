// 로그아웃 요청 API
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 로그아웃 (POST)
export async function POST(req) {
  // 토큰 검증
  const token = verifyToken(req)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${AUTH_API_BASE}/user/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "서버에서 로그아웃 처리 실패" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
