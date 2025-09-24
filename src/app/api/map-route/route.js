// map-route
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// SVG 도면 파일 조회 - 건물, 층 선택 시 (GET)
export async function GET(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: "인증이 필요합니다." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return new Response(JSON.stringify({ error: "잘못된 요청" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

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

  const data = await res.json()

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

// 내부 도면 노드 엣지 연결 (POST)
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

// 내부 도면 노드 엣지 연결 해제 (DELETE)
export async function DELETE(request) {
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
    const connectRes = await fetch(`${API_BASE}/room/disconnect`, {
      method: "DELETE",
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
