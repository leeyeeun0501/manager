// login-route
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"

// 로그인 API 요청
async function login(id, pw) {
  const res = await fetch(`${AUTH_API_BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, pw }),
  })

  if (!res.ok) return null
  const user = await res.json()
  return user
}

// 로그인 (POST)
export async function POST(request) {
  try {
    const { id, pw } = await request.json()

    if (!id || !pw) {
      return NextResponse.json(
        { success: false, error: "아이디와 비밀번호를 모두 입력하세요." },
        { status: 400 }
      )
    }

    const user = await login(id, pw)

    return NextResponse.json({
      id: user.id,
      name: user.name,
      islogin: true,
    })
  } catch (err) {
    console.error("로그인 처리 중 오류:", err)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 사용자 위치 검색 (GET)
export async function GET() {
  try {
    const res = await fetch(`${AUTH_API_BASE}/user/islogin`, { method: "GET" })
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "외부 서버 오류" },
        { status: res.status }
      )
    }
    const data = await res.json()
    const users = data.users || data

    // Last_Location이 있는 사용자만 변환
    const result = users
      .filter(
        (u) =>
          u.Last_Location &&
          typeof u.Last_Location.x === "number" &&
          typeof u.Last_Location.y === "number"
      )
      .map((u) => ({
        Id: u.Id,
        Name: u.Name,
        Last_Location: {
          x: u.Last_Location.x,
          y: u.Last_Location.y,
        },
      }))

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
