// 로그인 및 사용자 위치 검색 API
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 로그인 API 요청
async function login(id, pw) {
  const res = await fetch(`${AUTH_API_BASE}/user/admin_login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, pw }),
  })

  if (!res.ok) {
    // 401 Unauthorized인 경우 인증 실패로 처리
    if (res.status === 401) {
      return { success: false, message: "아이디 또는 비밀번호가 일치하지 않습니다." }
    }
    // 기타 오류는 서버 오류로 처리
    return { success: false, message: "서버 오류가 발생했습니다." }
  }
  
  const user = await res.json()
  return { success: true, data: user }
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

    const result = await login(id, pw)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.message.includes("일치하지 않습니다") ? 401 : 500 }
      )
    }

    console.log("✅ 로그인 성공! 외부 인증 서버로부터 받은 데이터:", result.data);
    console.log("🔑 수신된 토큰:", result.data.token);

    // 서버에서 받은 토큰과 사용자 정보를 그대로 전달
    return NextResponse.json({
      success: true,
      message: "로그인 성공",
      islogin: true,
      token: result.data.token,
      user: result.data.user
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 사용자 위치 검색 (GET)
export async function GET(request) {
  const token = verifyToken(request)
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  try {
    const res = await fetch(`${AUTH_API_BASE}/user/islogin`, { 
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
    
    // 데이터 구조 확인 및 배열 추출
    let users = []
    if (data.users && Array.isArray(data.users)) {
      users = data.users
    } else if (Array.isArray(data)) {
      users = data
    } else if (data.data && Array.isArray(data.data)) {
      users = data.data
    } else {
      return NextResponse.json([])
    }

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
