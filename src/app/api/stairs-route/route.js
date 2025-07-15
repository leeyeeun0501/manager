// route.js (Next.js 13+ App Router 기준)
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

export async function GET(request) {
  try {
    const reqBody = await request.json()
    const { building } = reqBody

    if (!building) {
      return NextResponse.json(
        { error: "건물 이름이 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/room/stairs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ building }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "계단 목록을 불러오지 못했습니다." },
        { status: 500 }
      )
    }

    const data = await res.json()

    return NextResponse.json({
      stairs: data?.stairs ?? [],
    })
  } catch (err) {
    return NextResponse.json(
      { error: "요청 처리 중 오류 발생" },
      { status: 500 }
    )
  }
}
