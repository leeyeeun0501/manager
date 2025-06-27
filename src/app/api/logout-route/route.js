// logout-route
import { NextResponse } from "next/server"

// 로그아웃 (POST)
export async function POST(req) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch("http://13.55.76.216:3001/user/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
