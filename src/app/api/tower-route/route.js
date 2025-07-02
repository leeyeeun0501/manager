// tower-route
import { NextResponse } from "next/server"

// 전체 데이터 조회 (GET)
export async function GET() {
  try {
    const res = await fetch("http://13.55.76.216:3000/path/", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "좌표 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }

    const data = await res.json()

    // x: 위도, y: 경도로 변환
    const nodes = Array.isArray(data)
      ? data.map((node) => ({
          id: node.id,
          x: node.lat, // 위도
          y: node.lng, // 경도
        }))
      : []

    return NextResponse.json({ nodes })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 경로 노드 정보 수정 (PUT)
export async function PUT(request) {
  try {
    // 요청 body에서 데이터 추출
    const { node_name, x, y } = await request.json()

    // 필수 값 체크
    if (!node_name || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { error: "node_name, x(위도), y(경도) 값을 모두 입력하세요." },
        { status: 400 }
      )
    }

    // 외부 API로 PUT 요청 (x: 위도, y: 경도)
    const res = await fetch("http://13.55.76.216:3000/path/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node_name, x, y }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "노드 정보 수정에 실패했습니다." },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json({ message: "노드 정보 수정 성공", data })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 건물/노드 추가 (POST)
export async function POST(request) {
  try {
    const json = await request.json()
    const { type, node_name, x, y, desc } = json

    if (
      !type ||
      !node_name ||
      x === undefined ||
      y === undefined ||
      isNaN(Number(x)) ||
      isNaN(Number(y))
    ) {
      return NextResponse.json(
        { success: false, error: "타입, 이름, 위도, 경도는 필수입니다." },
        { status: 400 }
      )
    }

    // 외부 API에 JSON 바디로 전달
    const res = await fetch("http://13.55.76.216:3000/path/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        node_name,
        x,
        y,
        ...(type === "building" && desc ? { desc } : {}),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, node: data })
  } catch (err) {
    console.error("POST /api/tower-route error:", err)
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 노드/건물 삭제 (DELETE)
export async function DELETE(request) {
  try {
    const { type, node_name } = await request.json()

    // 필수 값 체크
    if (!type || !node_name) {
      return NextResponse.json(
        { success: false, error: "타입(type)과 이름(node_name)은 필수입니다." },
        { status: 400 }
      )
    }

    // 외부 API에 DELETE 요청
    const res = await fetch("http://13.55.76.216:3000/path/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, node_name }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, message: "삭제 성공", data })
  } catch (err) {
    console.error("DELETE /api/tower-route error:", err)
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
