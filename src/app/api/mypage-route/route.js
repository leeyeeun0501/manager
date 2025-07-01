import { NextResponse } from "next/server"

// GET /api/mypage-route?id=아이디
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { success: false, error: "아이디가 필요합니다." },
      { status: 400 }
    )
  }

  try {
    // 외부 서버에서 사용자 정보 조회
    const apiUrl = `http://13.55.76.216:3001/user/${encodeURIComponent(id)}`
    const res = await fetch(apiUrl, { method: "GET" })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "외부 서버 오류" },
        { status: res.status }
      )
    }

    const data = await res.json()

    // data가 { id, name, phone, email, password } 형태라고 가정
    return NextResponse.json({ success: true, user: data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
