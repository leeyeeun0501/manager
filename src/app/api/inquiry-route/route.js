// inquiry-route
import { NextResponse } from "next/server"
import { AUTH_API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 문의 목록 조회 (GET)
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
    const res = await fetch(`${AUTH_API_BASE}/inquiry`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    
    if (!res.ok) {
      return NextResponse.json(
        { error: "문의 목록을 불러올 수 없습니다." },
        { status: 500 }
      )
    }
    
    const data = await res.json()
    
    // data.data 구조로 중첩된 경우 처리
    let inquiries = []
    if (data.data && data.data.inquiries) {
      inquiries = data.data.inquiries
    } else if (data.data && Array.isArray(data.data)) {
      inquiries = data.data
    } else if (data.inquiries) {
      inquiries = data.inquiries
    } else if (Array.isArray(data)) {
      inquiries = data
    }
    
    return NextResponse.json({ 
      success: true,
      inquiries: inquiries
    })
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 문의 답변 (PUT)
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
    const body = await request.json()
    const { inquiry_code, answer } = body

    if (!inquiry_code) {
      return NextResponse.json(
        { error: "문의 코드가 필요합니다." },
        { status: 400 }
      )
    }

    if (!answer) {
      return NextResponse.json(
        { error: "답변 내용이 필요합니다." },
        { status: 400 }
      )
    }

    const answerData = {
      inquiry_code: inquiry_code,
      answer: answer.trim(),
    }

    console.log('inquiry-route PUT - 외부 API 호출 (토큰 포함)')

    const res = await fetch(`${AUTH_API_BASE}/inquiry/answer`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(answerData),
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json(
        { error: errorData.error || "답변 등록에 실패했습니다." },
        { status: res.status }
      )
    }

    const result = await res.json()
    return NextResponse.json({
      success: true,
      inquiry: result.inquiry,
      message: "답변이 성공적으로 등록되었습니다.",
    })
  } catch (error) {
    console.error("답변 등록 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
