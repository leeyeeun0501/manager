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

    // 로그인 성공: id, name, islogin 포함해서 반환
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

// GET 등 다른 메서드는 허용하지 않음 -> 사실 뭔지 모르겠음
export async function GET() {
  return NextResponse.json(
    { error: "허용되지 않은 요청입니다." },
    { status: 405 }
  )
}
