// mypage-route
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"

// 회원정보 검색 (PUT)
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
    const apiUrl = `${AUTH_API_BASE}/user/${encodeURIComponent(id)}`
    const res = await fetch(apiUrl, { method: "GET" })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "외부 서버 오류" },
        { status: res.status }
      )
    }

    const data = await res.json()

    // data가 { id, name, phone, email, password }
    return NextResponse.json({ success: true, user: data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 회원정보 수정 (PUT)
export async function PUT(request) {
  try {
    const { id, pw, phone, email } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id는 필수입니다." },
        { status: 400 }
      )
    }
    if (!pw && !phone && !email) {
      return NextResponse.json(
        { success: false, error: "수정할 항목이 없습니다." },
        { status: 400 }
      )
    }

    const apiUrl = `${AUTH_API_BASE}/user/update`
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pw, phone, email }),
    })

    const text = await res.text()

    if (res.status === 200) {
      return NextResponse.json(
        { success: true, message: text },
        { status: 200 }
      )
    } else if (res.status === 400 || res.status === 404) {
      return NextResponse.json(
        { success: false, error: text },
        { status: res.status }
      )
    } else {
      return NextResponse.json(
        { success: false, error: "회원정보 수정 중 오류" },
        { status: 500 }
      )
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "회원정보 수정 중 오류" },
      { status: 500 }
    )
  }
}
