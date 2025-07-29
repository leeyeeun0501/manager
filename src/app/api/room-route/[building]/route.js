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
    const { building } = await params
    console.log("삭제 요청 - 건물명:", building)

    // 요청 본문에서 이미지 URL 배열 가져오기
    let imageUrls = []
    try {
      const body = await request.json()
      imageUrls = body.image_urls || []
      console.log("받은 이미지 URL들:", imageUrls)
    } catch (error) {
      console.error("요청 본문 파싱 실패:", error)
      // 기존 방식 호환성을 위해 query parameter도 확인
      const { searchParams } = new URL(request.url)
      const imageUrl = searchParams.get("image_url")
      if (imageUrl) {
        imageUrls = [imageUrl]
      }
    }

    if (!imageUrls || imageUrls.length === 0) {
      console.log("이미지 URL이 없음")
      return Response.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      )
    }

    // 모든 이미지를 한 번에 묶어서 삭제 요청
    const url = `${API_BASE}/building/${encodeURIComponent(building)}/image`
    console.log("외부 API URL:", url)
    console.log("전송할 데이터:", { image_urls: imageUrls })

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_urls: imageUrls }), // 배열로 한 번에 전송
      })

      console.log("외부 API 응답 상태:", response.status)
      console.log(
        "외부 API 응답 헤더:",
        Object.fromEntries(response.headers.entries())
      )

      if (!response.ok) {
        let errorMessage = "이미지 삭제 실패"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          console.log("외부 API 에러 데이터:", errorData)
        } catch {
          try {
            const textData = await response.text()
            errorMessage = textData || errorMessage
            console.log("외부 API 에러 텍스트:", textData)
          } catch {
            console.log("외부 API 응답 파싱 실패")
          }
        }
        return Response.json(
          { error: errorMessage },
          { status: response.status }
        )
      }

      const result = await response.json()
      console.log("외부 API 성공 응답:", result)
      return Response.json({
        success: true,
        message: `${imageUrls.length}개의 이미지가 삭제되었습니다.`,
        result: result,
      })
    } catch (fetchError) {
      console.error("외부 API 요청 실패:", fetchError)
      return Response.json(
        { error: `외부 API 연결 실패: ${fetchError.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("이미지 삭제 중 오류:", error)
    console.error("오류 스택:", error.stack)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
