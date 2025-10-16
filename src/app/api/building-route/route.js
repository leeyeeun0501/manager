// building-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

/**
 * API 요청을 처리하는 핸들러
 * @param {Request} request - Next.js 요청 객체
 * @param {Function} handler - 토큰 검증 후 실행될 비즈니스 로직 핸들러
 */
async function handleRequest(request, handler) {
  const token = verifyToken(request);
  if (!token) {
    return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
  }
  return handler(token);
}

async function getHandler(request, token) {
  const { searchParams } = new URL(request.url)

  // 건물 이름만 조회
  if (searchParams.get("type") === "names") {
    const res = await fetch(`${API_BASE}/building/names`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    const data = await res.json()
    // data.data 구조 처리
    const names = data.data?.data?.names || data.data?.names || data.names || data
    return NextResponse.json({ names: names })
  }

  // 전체 데이터 조회
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building && !floor) {
    const res = await fetch(`${API_BASE}/building`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    const data = await res.json()
    const mapped = (Array.isArray(data) ? data : []).map((b) => ({
      ...b,
      image: b.image || b.image_url || b.File || null,
    }))
    return NextResponse.json({ all: mapped })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}

// 건물 전체 데이터 조회/건물 이름만 조회 (GET)
export async function GET(request) {
  return handleRequest(request, (token) => getHandler(request, token));
}

async function putHandler(request, token) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")

  if (!building) {
    return NextResponse.json(
      { error: "building은 필수입니다." },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file") // 단일 대표 이미지
  const images = formData.getAll("images[]") // 여러 추가 이미지 (클라이언트에서 'images[]'로 보내는 것을 권장)
  const desc = formData.get("desc")

  // 수정할 항목이 있는지 확인 (file, desc, images 중 하나라도 있으면 됨)
  const hasFile = file && file.size > 0
  // 설명은 빈 문자열로도 업데이트 가능해야 하므로, null/undefined 여부만 체크
  const hasDesc = desc !== null
  const hasImages = images && images.length > 0

  console.log("🔍 수정 항목 확인:", { 
    hasFile, 
    hasDesc, 
    hasImages, 
    descValue: desc,
    file: file?.name,
    imageCount: images?.length,
  })

  // 이미지만 있는 경우도 처리할 수 있도록 수정
  if (!hasFile && !hasDesc && !hasImages) {
    console.log("❌ 수정할 항목이 없음 - 모든 조건 실패")
    return NextResponse.json(
      { error: "수정할 항목이 없습니다. 파일, 설명, 이미지 중 하나는 입력해주세요." },
      { status: 400 }
    )
  }

  console.log("✅ 수정할 항목 확인됨 - 처리 진행")

  const externalForm = new FormData()
  if (hasFile) externalForm.append("file", file)
  if (hasImages) {
    images.forEach((image, index) => {
      externalForm.append(`images`, image) // 외부 API 스펙에 따라 'images[]' 또는 'images'
    })
  }
  if (desc !== null && desc !== undefined) {
    externalForm.append("desc", desc)
    console.log("📤 외부 API로 설명 전송:", desc)
  }

  const res = await fetch(
    `${API_BASE}/building/${encodeURIComponent(building)}`,
    { 
      method: "PUT", 
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: externalForm 
    }
  )

  const text = await res.text()

  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error || data.message || "건물정보 수정 중 오류" },
      { status: res.status }
    )
  }

  return NextResponse.json(data)
}

// 건물 설명/맵 파일 수정 (PUT)
export async function PUT(request) {
  return handleRequest(request, (token) => putHandler(request, token));
}

async function deleteHandler(request, token) {
  try {
    const { searchParams } = new URL(request.url)
    const building = searchParams.get("building")

    if (!building) {
      return NextResponse.json(
        { error: "building은 필수입니다." },
        { status: 400 }
      )
    }

    const requestBody = await request.json()
    const { image_urls } = requestBody

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json(
        { error: "삭제할 이미지 URL이 필요합니다." },
        { status: 400 }
      )
    }

    // 외부 API로 이미지 삭제 요청
    const externalUrl = `${API_BASE}/building/${encodeURIComponent(building)}/image`
    
    const externalHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
    
    const res = await fetch(externalUrl, {
      method: "DELETE",
      headers: externalHeaders,
      body: JSON.stringify({ image_urls }),
    })
    
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "외부 API에서 이미지 삭제 실패" },
        { status: res.status }
      )
    }

    const responseText = await res.text()

    let result
    try {
      if (responseText.trim()) {
        result = JSON.parse(responseText)
      } else {
        result = { message: "이미지 삭제 완료" }
      }
    } catch (parseError) {
      result = { message: responseText || "이미지 삭제 완료" }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${image_urls.length}개의 이미지가 삭제되었습니다.`,
      result: result
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `서버 오류: ${err.message}` },
      { status: 500 }
    )
  }
}

// 건물 이미지 삭제 (DELETE)
export async function DELETE(request) {
  return handleRequest(request, (token) => deleteHandler(request, token));
}
