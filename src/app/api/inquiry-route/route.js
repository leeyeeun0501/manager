import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { AUTH_API_BASE } from "../apibase"

// 문의 목록 조회 (GET)
export async function GET(request) {
  try {
    const res = await fetch(`${AUTH_API_BASE}/inquiry`)
    if (!res.ok) {
      return NextResponse.json(
        { error: "문의 목록을 불러올 수 없습니다." },
        { status: 500 }
      )
    }
    const data = await res.json()
    // API로부터 받아온 데이터가 배열이면 inquiries: data, 객체에 나오면 inquiries: data.inquiries
    return NextResponse.json({ inquiries: data.inquiries || data || [] })
  } catch (error) {
    console.error("문의 조회 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 문의 답변 (PUT)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { inquiry_code, answer } = body

    console.log("받은 데이터:", body)
    console.log("문의 코드:", inquiry_code)
    console.log("답변:", answer)

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

    console.log("서버로 전송할 데이터:", answerData)

    const res = await fetch(`${AUTH_API_BASE}/inquiry/answer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
