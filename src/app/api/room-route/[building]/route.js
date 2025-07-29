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

    // 요청 본문에서 이미지 URL 배열 가져오기
    let imageUrls = []
    try {
      const body = await request.json()
      imageUrls = body.image_urls || []
    } catch {
      // 기존 방식 호환성을 위해 query parameter도 확인
      const { searchParams } = new URL(request.url)
      const imageUrl = searchParams.get("image_url")
      if (imageUrl) {
        imageUrls = [imageUrl]
      }
    }

    if (!imageUrls || imageUrls.length === 0) {
      return Response.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      )
    }

    // 각 이미지를 순차적으로 삭제
    const deletePromises = imageUrls.map(async (imageUrl) => {
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
        throw new Error(errorMessage)
      }

      return { success: true, imageUrl }
    })

    // 모든 삭제 작업을 병렬로 실행
    const results = await Promise.allSettled(deletePromises)

    // 실패한 작업이 있는지 확인
    const failedResults = results.filter(
      (result) => result.status === "rejected"
    )

    if (failedResults.length > 0) {
      const errorMessages = failedResults.map((result) => result.reason.message)
      return Response.json(
        {
          error: `일부 이미지 삭제 실패: ${errorMessages.join(", ")}`,
          failedCount: failedResults.length,
          totalCount: imageUrls.length,
        },
        { status: 400 }
      )
    }

    return Response.json({
      success: true,
      message: `${imageUrls.length}개의 이미지가 삭제되었습니다.`,
    })
  } catch (error) {
    console.error("이미지 삭제 중 오류:", error)
    return Response.json({ error: "서버 오류" }, { status: 500 })
  }
}
