// mypage-route
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 로그인 시 해당 아이디 회원정보 검색 (GET)
export async function GET(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

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
    const res = await fetch(apiUrl, { 
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "외부 서버 오류" },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json({ success: true, user: data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 회원정보 수정 - 비밀번호, 전화번호, 이메일 (PUT)
export async function PUT(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

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
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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
