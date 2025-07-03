// node-route
import { NextResponse } from "next/server"

// 전체 노드 데이터 조회 (GET)
export async function GET() {
  try {
    // 1. edges 데이터 가져오기
    const edgesRes = await fetch("http://13.55.76.216:3000/path/edges", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!edgesRes.ok) {
      return NextResponse.json(
        { error: "노드 연결 정보를 불러올 수 없습니다." },
        { status: edgesRes.status }
      )
    }
    const edgesData = await edgesRes.json()

    // 그대로 반환
    return NextResponse.json({ edges: edgesData })
  } catch (err) {
    console.log("서버 오류:", err)
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 엣지 연결 (POST)
export async function POST(request) {
  try {
    const { from_node, to_node } = await request.json()

    if (!from_node || !to_node) {
      return NextResponse.json(
        { success: false, error: "from_node, to_node는 필수입니다." },
        { status: 400 }
      )
    }

    const res = await fetch("http://13.55.76.216:3000/path/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_node, to_node }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, edge: data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 엣지 연결 해제 (DELETE)
export async function DELETE(request) {
  try {
    // body 파싱
    const { from_node, to_node } = await request.json()

    // body가 비어있을 때 로그 확인
    if (!from_node || !to_node) {
      console.log("DELETE body 파싱 실패. request body:", await request.text())
      return NextResponse.json(
        { success: false, error: "from_node, to_node는 필수입니다." },
        { status: 400 }
      )
    }

    // 외부 서버로 DELETE 요청 (body 포함)
    const res = await fetch("http://13.55.76.216:3000/path/disconnect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_node, to_node }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, edge: data })
  } catch (err) {
    console.log("DELETE 서버 오류:", err)
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
