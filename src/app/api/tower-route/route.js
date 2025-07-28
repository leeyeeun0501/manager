// tower-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 전체 데이터 조회 (GET)
export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/path/`, {
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

    const nodes = Array.isArray(data)
      ? data.map((node) => ({
          id: node.id,
          x: node.lat,
          y: node.lng,
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
    const { node_name, x, y } = await request.json()

    if (!node_name || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { error: "node_name, x(위도), y(경도) 값을 모두 입력하세요." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/path/`, {
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
    // Content-Type 확인하여 FormData인지 JSON인지 판단
    const contentType = request.headers.get("content-type") || ""

    let type, node_name, x, y, desc, images

    if (contentType.includes("multipart/form-data")) {
      // FormData 처리 (이미지 포함)
      const formData = await request.formData()
      type = formData.get("type")
      node_name = formData.get("node_name")
      x = formData.get("x")
      y = formData.get("y")
      desc = formData.get("desc")
      // 배열 인덱스로 이미지들 가져오기
      images = []
      let index = 0
      while (formData.get(`images[${index}]`)) {
        images.push(formData.get(`images[${index}]`))
        index++
      }
    } else {
      // JSON 처리 (기존 방식)
      const json = await request.json()
      type = json.type
      node_name = json.node_name
      x = json.x
      y = json.y
      desc = json.desc
    }

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

    // FormData로 외부 API 호출
    const formDataToSend = new FormData()
    formDataToSend.append("type", type)
    formDataToSend.append("node_name", node_name)
    formDataToSend.append("x", x)
    formDataToSend.append("y", y)
    if (type === "building" && desc) {
      formDataToSend.append("desc", desc)
    }
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formDataToSend.append(`images[${index}]`, image)
      })
    }

    const res = await fetch(`${API_BASE}/path/create`, {
      method: "POST",
      body: formDataToSend,
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

// 건물/노드 삭제 (DELETE
export async function DELETE(request) {
  try {
    const { type, node_name } = await request.json()

    if (!type || !node_name) {
      return NextResponse.json(
        { success: false, error: "타입(type)과 이름(node_name)은 필수입니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/path/`, {
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
