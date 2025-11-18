// 외부 노드 요청 API
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 외부 전체 노드 데이터 조회 (GET)
export async function GET(request) {
  try {
    // 토큰 검증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const edgesRes = await fetch(`${API_BASE}/path/edges`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
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
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 외부 엣지 연결 (POST)
export async function POST(request) {
  try {
    // 토큰 검증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const { from_node, to_node } = await request.json()

    if (!from_node || !to_node) {
      return NextResponse.json(
        { success: false, error: "from_node, to_node는 필수입니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/path/connect`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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

// 외부 엣지 연결 해제 (DELETE)
export async function DELETE(request) {
  try {
    // 토큰 검증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const { from_node, to_node } = await request.json()

    if (!from_node || !to_node) {
      return NextResponse.json(
        { success: false, error: "from_node, to_node는 필수입니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/path/disconnect`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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
