// 세션 체크 API
import { NextResponse } from "next/server"
import { verifyToken } from "../../utils/authHelper"

export async function GET(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  // 토큰이 유효하면 성공 응답
  return NextResponse.json({ 
    success: true, 
    message: "세션이 유효합니다." 
  })
}
