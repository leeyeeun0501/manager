// app/api/roomnode-route.js (혹은 app/api/roomnode/route.js)
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 전체 노드 연결(엣지) 정보 조회 (GET)
export async function GET() {
  try {
    const edgesRes = await fetch(`${API_BASE}/room/edges`, {
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
    return NextResponse.json({ edges: edgesData })
  } catch (err) {
    console.log("서버 오류:", err)
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 노드 연결(엣지 추가) (PUT)
export async function PUT(request) {
  try {
    const {
      from_building,
      from_floor,
      from_node,
      to_building,
      to_floor,
      to_node,
    } = await request.json()

    // 필수값 체크
    if (
      !from_building ||
      !from_floor ||
      !from_node ||
      !to_building ||
      !to_floor ||
      !to_node
    ) {
      return NextResponse.json(
        { success: false, error: "모든 필드가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/room/connect`, {
      method: "PUT",
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

// 노드 연결 해제 (DELETE)
export async function DELETE(request) {
  try {
    const {
      from_building,
      from_floor,
      from_node,
      to_building,
      to_floor,
      to_node,
    } = await request.json()

    if (
      !from_building ||
      !from_floor ||
      !from_node ||
      !to_building ||
      !to_floor ||
      !to_node
    ) {
      return NextResponse.json(
        { success: false, error: "모든 필드가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/room/disconnect`, {
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
