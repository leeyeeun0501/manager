import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 문의 목록 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  try {
    if (id) {
      // 특정 문의 상세 조회
      const res = await fetch(`${API_BASE}/inquiry/${id}`)
      if (!res.ok) {
        return NextResponse.json(
          { error: "문의를 찾을 수 없습니다." },
          { status: 404 }
        )
      }
      const inquiry = await res.json()
      return NextResponse.json({ inquiry })
    } else {
      // 문의 목록 조회
      const res = await fetch(`${API_BASE}/inquiry`)
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

// 새 문의 생성 (POST)
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, content, category } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용은 필수입니다." },
        { status: 400 }
      )
    }

    const inquiryData = {
      title: title.trim(),
      content: content.trim(),
      category: category || "general",
      status: "pending",
      created_at: new Date().toISOString(),
    }

    const res = await fetch(`${API_BASE}/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inquiryData),
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json(
        { error: errorData.error || "문의 등록에 실패했습니다." },
        { status: res.status }
      )
    }

    const result = await res.json()
    return NextResponse.json({
      success: true,
      inquiry: result.inquiry,
      message: "문의가 성공적으로 등록되었습니다.",
    })
  } catch (error) {
    console.error("문의 생성 오류:", error)
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
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "문의 ID가 필요합니다." },
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

    const res = await fetch(`${API_BASE}/inquiry/${id}/answer`, {
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

// 문의 삭제 (DELETE)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "문의 ID가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/inquiry/${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "문의 삭제에 실패했습니다." },
        { status: res.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "문의가 성공적으로 삭제되었습니다.",
    })
  } catch (error) {
    console.error("문의 삭제 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
