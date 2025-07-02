import { NextResponse } from "next/server"

// 전체 노드 데이터 조회 (GET)
export async function GET() {
  try {
    const res = await fetch("http://13.55.76.216:3000/path/nodes", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "노드 좌표 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }

    const data = await res.json()

    // 노드 데이터 구조에 맞게 가공 (예시: id, lat, lng)
    const nodes = Array.isArray(data)
      ? data.map((node) => ({
          id: node.id,
          lat: node.lat,
          lng: node.lng,
        }))
      : []

    return NextResponse.json({ nodes })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}
