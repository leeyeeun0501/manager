// route.js (Next.js 13+ App Router 기준)
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const building = searchParams.get("building")

    if (!building) {
      return NextResponse.json(
        { error: "건물 이름이 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${API_BASE}/room/stairs?building=${encodeURIComponent(building)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

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
    console.error("API Error:", err)
    return NextResponse.json(
      { error: "요청 처리 중 오류 발생" },
      { status: 500 }
    )
  }
}
