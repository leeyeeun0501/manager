// building-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 건물 전체 데이터 조회/건물 이름만 조회 (GET)
export async function GET(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

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

// 건물 설명/맵 파일 수정 (PUT)
export async function PUT(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")

  if (!building) {
    return NextResponse.json(
      { error: "building은 필수입니다." },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  // 배열 인덱스로 이미지들 가져오기
  const images = []
  let index = 0
  console.log("🔍 FormData에서 이미지 파싱 시작...")
  
  while (formData.get(`images[${index}]`)) {
    const image = formData.get(`images[${index}]`)
    console.log(`🔍 images[${index}] 발견:`, image.name, image.size)
    images.push(image)
    index++
  }
  
  console.log("🔍 인덱스 방식으로 찾은 이미지 수:", images.length)

  // 추가: images 키로도 확인 ??????
  const imagesAlt = formData.getAll("images")
  console.log("🔍 images 키로 찾은 이미지 수:", imagesAlt.length)
  
  if (imagesAlt.length > 0) {
    imagesAlt.forEach((image, idx) => {
      if (!images.find((img) => img.name === image.name)) {
        console.log(`🔍 images[${idx}] 추가:`, image.name, image.size)
        images.push(image)
      }
    })
  }
  
  console.log("🔍 최종 이미지 배열:", images.map(img => ({ name: img.name, size: img.size })))

  const desc = formData.get("desc")

  // 수정할 항목이 있는지 확인 (file, desc, images 중 하나라도 있으면 됨)
  const hasFile = file && file.size > 0
  const hasDesc = desc !== null && desc !== undefined && desc.trim().length > 0
  const hasImages = images && images.length > 0

  console.log("🔍 수정 항목 확인:", { 
    hasFile, 
    hasDesc, 
    hasImages, 
    desc: desc?.trim(), 
    imageCount: images?.length,
    descIsNull: desc === null,
    descIsUndefined: desc === undefined,
    descValue: desc
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
  if (file && file.size > 0) externalForm.append("file", file)
  if (images && images.length > 0) {
    images.forEach((image, index) => {
      externalForm.append(`images[${index}]`, image)
    })
  }
  // 설명이 있으면 전송 (빈 문자열이어도)
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

// 건물 이미지 삭제 (DELETE)
export async function DELETE(request) {
  console.log("🗑️ DELETE 메서드 시작")
  
  try {
    // 요청 헤더 확인
    const authHeader = request.headers.get('authorization')
    console.log("🔑 요청 Authorization 헤더:", authHeader)
    console.log("🔑 요청 헤더 전체:", Object.fromEntries(request.headers.entries()))
    
    // 토큰 검증
    const token = verifyToken(request)
    console.log("🔑 토큰 검증 결과:", token ? "토큰 있음" : "토큰 없음")
    console.log("🔑 토큰 값:", token)
    
    if (!token) {
      console.log("❌ 토큰이 없어서 401 반환")
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const building = searchParams.get("building")
    console.log("🏢 building 파라미터:", building)

    if (!building) {
      return NextResponse.json(
        { error: "building은 필수입니다." },
        { status: 400 }
      )
    }

    const requestBody = await request.json()
    console.log("📦 요청 본문:", requestBody)
    
    const { image_urls } = requestBody

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json(
        { error: "삭제할 이미지 URL이 필요합니다." },
        { status: 400 }
      )
    }

    console.log("🗑️ 건물 이미지 삭제 요청:", { building, image_urls })

    // 외부 API로 이미지 삭제 요청
    const externalUrl = `${API_BASE}/building/${encodeURIComponent(building)}/image`
    console.log("🌐 외부 API URL:", externalUrl)
    console.log("🔑 외부 API로 전송할 토큰:", token)
    console.log("🔑 외부 API Authorization 헤더:", `Bearer ${token}`)
    
    const externalHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
    console.log("🔑 외부 API 요청 헤더:", externalHeaders)
    
    const res = await fetch(externalUrl, {
      method: "DELETE",
      headers: externalHeaders,
      body: JSON.stringify({ image_urls }),
    })

    console.log("📡 외부 API 응답 상태:", res.status)
    console.log("📡 외부 API 응답 헤더:", Object.fromEntries(res.headers.entries()))
    
    if (!res.ok) {
      const errorText = await res.text()
      console.log("📡 외부 API 오류 응답:", errorText)
      return NextResponse.json(
        { success: false, error: "외부 API에서 이미지 삭제 실패" },
        { status: res.status }
      )
    }

    const responseText = await res.text()
    console.log("📡 외부 API 응답:", responseText)

    let result
    try {
      if (responseText.trim()) {
        result = JSON.parse(responseText)
      } else {
        result = { message: "이미지 삭제 완료" }
      }
    } catch (parseError) {
      console.log("📡 응답 파싱 실패, 기본 메시지 사용:", parseError)
      result = { message: responseText || "이미지 삭제 완료" }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${image_urls.length}개의 이미지가 삭제되었습니다.`,
      result: result
    })
  } catch (err) {
    console.error("❌ 이미지 삭제 오류:", err)
    console.error("❌ 오류 스택:", err.stack)
    return NextResponse.json(
      { success: false, error: `서버 오류: ${err.message}` },
      { status: 500 }
    )
  }
}
