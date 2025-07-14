// mapfile-image-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 전체 데이터 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return new Response(JSON.stringify({ error: "잘못된 요청" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const imageRes = await fetch(
    `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
      building
    )}`
  )

  if (!imageRes.ok) {
    return new NextResponse("도면 이미지를 불러올 수 없습니다.", {
      status: 404,
    })
  }

  const contentType = imageRes.headers.get("content-type") || "image/png"
  const arrayBuffer = await imageRes.arrayBuffer()
  if (
    contentType.includes("svg") ||
    contentType.includes("xml") ||
    contentType.startsWith("text/")
  ) {
    const text = new TextDecoder("utf-8").decode(arrayBuffer)
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": contentType },
    })
  } else {
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: { "Content-Type": contentType },
    })
  }
}

// 노드 엣지 연결 (POST)
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      from_building,
      from_floor,
      from_node,
      to_building,
      to_floor,
      to_node,
    } = body

    // 필수 값 체크
    if (
      !from_building ||
      !from_floor ||
      !from_node ||
      !to_building ||
      !to_floor ||
      !to_node
    ) {
      return new Response(JSON.stringify({ error: "필수 값 누락" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 실제 연결 처리 API 호출 (예시)
    const connectRes = await fetch(`${API_BASE}/room/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_building,
        from_floor,
        from_node,
        to_building,
        to_floor,
        to_node,
      }),
    })

    if (!connectRes.ok) {
      return new Response(JSON.stringify({ error: "노드 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = await connectRes.json()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "서버 에러", detail: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
