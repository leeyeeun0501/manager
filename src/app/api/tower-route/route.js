// tower-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 로컬 노드 저장소 (외부 API 실패 시 사용)
let localNodes = []

// 건물/노드 위치 전체 데이터 조회 (GET)
export async function GET(request) {
  try {
    // 토큰 인증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      )
    }
    try {
      const res = await fetch(`${API_BASE}/path/`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
    } catch (externalError) {}

    return NextResponse.json({ nodes: localNodes })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 경로 노드 정보 수정 (PUT) !!!!!
export async function PUT(request) {
  try {
    // 토큰 인증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      )
    }

    const { node_name, x, y } = await request.json()

    if (!node_name || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { error: "node_name, x(위도), y(경도) 값을 모두 입력하세요." },
        { status: 400 }
      )
    }

    try {
      const res = await fetch(`${API_BASE}/path/`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ node_name, x, y }),
      })

      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ message: "노드 정보 수정 성공", data })
      }
    } catch (externalError) {
    }

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
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

// 건물/노드 추가 (POST) ?????
export async function POST(request) {
  try {
    // 토큰 인증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      )
    }

    const contentType = request.headers.get("content-type") || ""
    console.log("🔍 tower-route POST - Content-Type:", contentType)

    let type, node_name, x, y, desc, images

    if (contentType.includes("multipart/form-data")) {
      console.log("📝 FormData 요청 처리 중...")
      const formData = await request.formData()

      type = formData.get("type")
      node_name = formData.get("node_name")
      x = formData.get("x")
      y = formData.get("y")
      desc = formData.get("desc")

      console.log("📝 FormData 값들:", { type, node_name, x, y, desc })

      images = []
      let index = 0
      while (formData.get(`images[${index}]`)) {
        images.push(formData.get(`images[${index}]`))
        index++
      }
    } else {
      console.log("📝 JSON 요청 처리 중...")
      try {
        const json = await request.json()
        type = json.type
        node_name = json.node_name
        x = json.x
        y = json.y
        desc = json.desc
        console.log("📝 JSON 값들:", { type, node_name, x, y, desc })
      } catch (jsonError) {
        console.log("❌ JSON 파싱 오류:", jsonError.message)
        return NextResponse.json(
          { success: false, error: `JSON 파싱 오류: ${jsonError.message}` },
          { status: 400 }
        )
      }
    }

    // FormData에서 받은 값들을 숫자로 변환
    const numX = Number(x)
    const numY = Number(y)

    if (
      !type ||
      !node_name ||
      x === undefined ||
      y === undefined ||
      isNaN(numX) ||
      isNaN(numY)
    ) {
      console.log("❌ 유효성 검사 실패:", { type, node_name, x, y, numX, numY })
      return NextResponse.json(
        { success: false, error: "타입, 이름, 위도, 경도는 필수입니다." },
        { status: 400 }
      )
    }

    const formDataToSend = new FormData()
    formDataToSend.append("type", type)
    formDataToSend.append("node_name", node_name)
    formDataToSend.append("x", numX.toString())
    formDataToSend.append("y", numY.toString())
    if (type === "building" && desc) {
      formDataToSend.append("desc", desc)
    }
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formDataToSend.append(`images[${index}]`, image)
      })
    }

    try {
      console.log("🌐 외부 API 호출 시작:", `${API_BASE}/path/create`)
      const res = await fetch(`${API_BASE}/path/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formDataToSend,
      })

      console.log("🌐 외부 API 응답 상태:", res.status)
      
      let data
      try {
        data = await res.json()
      } catch (jsonError) {
        console.log("❌ 외부 API 응답 JSON 파싱 오류:", jsonError.message)
        const responseText = await res.text()
        console.log("❌ 외부 API 응답 텍스트:", responseText)
        throw new Error(`외부 API 응답 파싱 오류: ${jsonError.message}`)
      }

      if (!res.ok) {
        console.log("❌ 외부 API 오류:", data)
        throw new Error(data.error || "외부 서버 오류")
      }

      console.log("✅ 외부 API 성공:", data)
      return NextResponse.json({ success: true, node: data })
    } catch (externalError) {
      console.log("❌ 외부 API 호출 실패, 로컬 저장소 사용:", externalError.message)
      const newNode = {
        id: Date.now().toString(),
        type,
        node_name,
        x: numX,
        y: numY,
        desc: desc || "",
        created_at: new Date().toISOString(),
        images: images
          ? images.map((img) => ({ name: img.name, size: img.size }))
          : [],
      }

      localNodes.push(newNode)

      return NextResponse.json({
        success: true,
        node: newNode,
        message: "로컬 저장소에 저장되었습니다. (외부 API 연결 실패)",
      })
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `서버 오류: ${err.message}` },
      { status: 500 }
    )
  }
}

// 건물/노드 삭제 (DELETE) ?????
export async function DELETE(request) {
  try {
    // 토큰 인증
    const token = verifyToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다. 다시 로그인해주세요." },
        { status: 401 }
      )
    }

    const { type, node_name } = await request.json()

    if (!type || !node_name) {
      return NextResponse.json(
        { success: false, error: "타입(type)과 이름(node_name)은 필수입니다." },
        { status: 400 }
      )
    }

    try {
      const res = await fetch(`${API_BASE}/path/`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type, node_name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "외부 서버 오류")
      }

      return NextResponse.json({ success: true, message: "삭제 성공", data })
    } catch (externalError) {
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
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
