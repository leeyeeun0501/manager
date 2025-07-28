// tower-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"

// 임시 로컬 저장소 (외부 API가 작동하지 않을 때 사용)
let localNodes = []

// 전체 데이터 조회 (GET)
export async function GET() {
  try {
    // 먼저 외부 API 시도
    try {
      const res = await fetch(`${API_BASE}/path/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        const data = await res.json()
        const nodes = Array.isArray(data)
          ? data.map((node) => ({
              id: node.id,
              x: node.lat,
              y: node.lng,
            }))
          : []
        return NextResponse.json({ nodes })
      }
    } catch (externalError) {
      console.log(
        "외부 API 연결 실패, 로컬 데이터 사용:",
        externalError.message
      )
    }

    // 외부 API 실패 시 로컬 데이터 반환
    return NextResponse.json({ nodes: localNodes })
  } catch (err) {
    console.error("GET 오류:", err)
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

    // 먼저 외부 API 시도
    try {
      const res = await fetch(`${API_BASE}/path/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_name, x, y }),
      })

      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ message: "노드 정보 수정 성공", data })
      }
    } catch (externalError) {
      console.log(
        "외부 API 연결 실패, 로컬 데이터 수정:",
        externalError.message
      )
    }

    // 외부 API 실패 시 로컬 데이터 수정
    const nodeIndex = localNodes.findIndex(
      (node) => node.node_name === node_name
    )
    if (nodeIndex !== -1) {
      localNodes[nodeIndex] = { ...localNodes[nodeIndex], x, y }
      return NextResponse.json({ message: "로컬 노드 정보 수정 성공" })
    } else {
      return NextResponse.json(
        { error: "노드를 찾을 수 없습니다." },
        { status: 404 }
      )
    }
  } catch (err) {
    console.error("PUT 오류:", err)
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 건물/노드 추가 (POST)
export async function POST(request) {
  try {
    console.log("=== POST /api/tower-route 시작 ===")

    // Content-Type 확인하여 FormData인지 JSON인지 판단
    const contentType = request.headers.get("content-type") || ""
    console.log("Content-Type:", contentType)

    let type, node_name, x, y, desc, images

    if (contentType.includes("multipart/form-data")) {
      console.log("FormData 처리 시작")
      // FormData 처리 (이미지 포함)
      const formData = await request.formData()
      console.log("FormData 파싱 완료")

      type = formData.get("type")
      node_name = formData.get("node_name")
      x = formData.get("x")
      y = formData.get("y")
      desc = formData.get("desc")

      console.log("기본 데이터 추출:", { type, node_name, x, y, desc })

      // 배열 인덱스로 이미지들 가져오기
      images = []
      let index = 0
      while (formData.get(`images[${index}]`)) {
        images.push(formData.get(`images[${index}]`))
        index++
      }
      console.log("이미지 추출 완료, 개수:", images.length)

      console.log(
        "FormData - type:",
        type,
        "node_name:",
        node_name,
        "x:",
        x,
        "y:",
        y,
        "desc:",
        desc,
        "images count:",
        images.length
      )

      // 이미지 상세 정보 로그
      images.forEach((image, index) => {
        console.log(`Received Image ${index}:`, {
          name: image.name,
          type: image.type,
          size: image.size,
          lastModified: image.lastModified,
        })
      })
    } else {
      // JSON 처리 (기존 방식)
      const json = await request.json()
      type = json.type
      node_name = json.node_name
      x = json.x
      y = json.y
      desc = json.desc

      console.log(
        "JSON - type:",
        type,
        "node_name:",
        node_name,
        "x:",
        x,
        "y:",
        y,
        "desc:",
        desc
      )
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

    console.log("외부 API 호출 준비 시작")
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
    console.log("FormData 구성 완료")

    console.log(
      "Sending to external API - type:",
      type,
      "node_name:",
      node_name,
      "x:",
      x,
      "y:",
      y,
      "desc:",
      desc,
      "images count:",
      images ? images.length : 0
    )

    console.log("외부 API 호출 시작:", `${API_BASE}/path/create`)

    // 먼저 외부 API 시도
    try {
      const res = await fetch(`${API_BASE}/path/create`, {
        method: "POST",
        body: formDataToSend,
      })

      console.log("External API response status:", res.status)
      console.log(
        "External API response headers:",
        Object.fromEntries(res.headers.entries())
      )

      const data = await res.json()
      console.log("External API response data:", data)

      if (!res.ok) {
        throw new Error(data.error || "외부 서버 오류")
      }

      return NextResponse.json({ success: true, node: data })
    } catch (externalError) {
      console.log(
        "외부 API 연결 실패, 로컬 저장소 사용:",
        externalError.message
      )

      // 외부 API 실패 시 로컬 저장소에 저장
      const newNode = {
        id: Date.now().toString(),
        type,
        node_name,
        x: Number(x),
        y: Number(y),
        desc: desc || "",
        created_at: new Date().toISOString(),
        images: images
          ? images.map((img) => ({ name: img.name, size: img.size }))
          : [],
      }

      localNodes.push(newNode)
      console.log("로컬 저장소에 저장됨:", newNode)

      return NextResponse.json({
        success: true,
        node: newNode,
        message: "로컬 저장소에 저장되었습니다. (외부 API 연결 실패)",
      })
    }
  } catch (err) {
    console.error("=== POST /api/tower-route 오류 ===")
    console.error("오류 메시지:", err.message)
    console.error("오류 스택:", err.stack)
    console.error("오류 객체:", err)
    return NextResponse.json(
      { success: false, error: `서버 오류: ${err.message}` },
      { status: 500 }
    )
  }
}

// 건물/노드 삭제 (DELETE)
export async function DELETE(request) {
  try {
    const { type, node_name } = await request.json()

    if (!type || !node_name) {
      return NextResponse.json(
        { success: false, error: "타입(type)과 이름(node_name)은 필수입니다." },
        { status: 400 }
      )
    }

    // 먼저 외부 API 시도
    try {
      const res = await fetch(`${API_BASE}/path/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, node_name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "외부 서버 오류")
      }

      return NextResponse.json({ success: true, message: "삭제 성공", data })
    } catch (externalError) {
      console.log(
        "외부 API 연결 실패, 로컬 데이터 삭제:",
        externalError.message
      )

      // 외부 API 실패 시 로컬 데이터에서 삭제
      const initialLength = localNodes.length
      localNodes = localNodes.filter(
        (node) => !(node.type === type && node.node_name === node_name)
      )

      if (localNodes.length < initialLength) {
        return NextResponse.json({
          success: true,
          message: "로컬 저장소에서 삭제되었습니다. (외부 API 연결 실패)",
        })
      } else {
        return NextResponse.json(
          { error: "삭제할 노드를 찾을 수 없습니다." },
          { status: 404 }
        )
      }
    }
  } catch (err) {
    console.error("DELETE /api/tower-route error:", err)
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
