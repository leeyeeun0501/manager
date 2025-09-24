// user-route
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 전체 사용자 조회 (GET)
export async function GET(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  try {
    const res = await fetch(`${AUTH_API_BASE}/user`, { 
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
    
    // data.data 구조 처리
    const users = data.data?.data?.users || data.data?.users || data.users || data
    
    return NextResponse.json({ users: users })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 사용자 삭제 (DELETE)
export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${AUTH_API_BASE}/user/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
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
