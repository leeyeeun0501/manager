import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { AUTH_API_BASE } from "../apibase"

// 문의 목록 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const inquiry_code = searchParams.get("inquiry_code")

  try {
    if (inquiry_code) {
      // 특정 문의 코드로 조회
      const res = await fetch(
        `${AUTH_API_BASE}/inquiry?inquiry_code=${encodeURIComponent(
          inquiry_code
        )}`
      )
      if (!res.ok) {
        return NextResponse.json(
          { error: "문의를 찾을 수 없습니다." },
          { status: 404 }
        )
      }
      const data = await res.json()
      return NextResponse.json({ inquiry: data.inquiry })
    } else {
      // 문의 목록 조회
      const res = await fetch(`${AUTH_API_BASE}/inquiry`)
      if (!res.ok) {
        return NextResponse.json(
          { error: "문의 목록을 불러올 수 없습니다." },
          { status: 500 }
        )
      }
      const data = await res.json()
      return NextResponse.json({ inquiries: data.inquiries || [] })
    }
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
    const { searchParams } = new URL(request.url)
    const inquiry_code = searchParams.get("inquiry_code")

    if (!inquiry_code) {
      return NextResponse.json(
        { error: "문의 코드가 필요합니다." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { answer } = body

    if (!answer) {
      return NextResponse.json(
        { error: "답변 내용이 필요합니다." },
        { status: 400 }
      )
    }

    const answerData = {
      answer: answer.trim(),
      status: "answered",
      answered_at: new Date().toISOString(),
    }

    const res = await fetch(
      `${AUTH_API_BASE}/inquiry/${encodeURIComponent(inquiry_code)}/answer`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answerData),
      }
    )

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
