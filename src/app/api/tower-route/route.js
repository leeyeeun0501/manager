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
    const formData = await request.formData()
    const type = formData.get("type") // building 또는 node
    const node_name = formData.get("node_name")
    const x = formData.get("x")
    const y = formData.get("y")
    const description = formData.get("desc") // 건물일 때만

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

    const externalForm = new FormData()
    externalForm.append("type", type)
    externalForm.append("node_name", node_name)
    externalForm.append("x", x)
    externalForm.append("y", y)
    if (type === "building" && desc) {
      externalForm.append("description", desc)
    }

    const res = await fetch("http://13.55.76.216:3000/path/create", {
      method: "POST",
      body: externalForm,
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
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
