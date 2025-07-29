// room-route/[building]
import { NextResponse } from "next/server"
import { API_BASE } from "../../apibase"

// 강의실 조회(건물) (GET)
export async function GET(request, { params }) {
  const { building } = await params

  try {
    const url = `${API_BASE}/room/${encodeURIComponent(building)}`
    const res = await fetch(url)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error || "강의실 조회 실패" },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 건물 사진 삭제 (DELETE)
export async function DELETE(request, { params }) {
  try {
    const building = params.building
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("image_url")

    if (!imageUrl) {
      return Response.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      )
    }

    const url = `${API_BASE}/building/${encodeURIComponent(building)}/image`
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_url: imageUrl }),
    })

    if (!response.ok) {
      let errorMessage = "이미지 삭제 실패"
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        try {
          const textData = await response.text()
          errorMessage = textData || errorMessage
        } catch {
          // text() 마저 실패하면 기본 에러 메시지 사용
        }
      }
      return Response.json({ error: errorMessage }, { status: response.status })
    }

    let result = { success: true }
    try {
      const data = await response.json()
      result.data = data
    } catch {
      // JSON 파싱 실패해도 성공으로 처리
    }
    return Response.json(result)
  } catch (error) {
    console.error("이미지 삭제 중 오류:", error)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
