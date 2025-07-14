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

  // 서버에서 이미지 URL + 노드/엣지 정보가 같이 담긴 JSON을 반환한다고 가정
  const res = await fetch(
    `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
      building
    )}`
  )

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: "도면 이미지를 불러올 수 없습니다." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  // JSON으로 파싱
  const data = await res.json()

  // 그대로 반환
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
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
