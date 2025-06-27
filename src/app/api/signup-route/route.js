// signup-route
import { NextResponse } from "next/server"

// 회원가입 API 요청
async function registerUser({ id, pw, name, phone, email }) {
  const res = await fetch("http://13.55.76.216:3001/user/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, pw, name, phone, email }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || "회원가입 실패")
  }
  return data
}

// 회원가입 (POST)
export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.id || !body.pw || !body.name || !body.phone || !body.email) {
      return NextResponse.json(
        { message: "모든 항목을 입력하세요." },
        { status: 400 }
      )
    }
    await registerUser(body)
    return NextResponse.json({ message: "회원가입 성공" }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "회원가입 오류" },
      { status: 500 }
    )
  }
}
