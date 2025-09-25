// floor-route
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 층 전체 데이터/건물명 조회 (GET)
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
  const building = searchParams.get("building")

  // 전체 층 정보 조회
  if (!building) {
    const res = await fetch(`${API_BASE}/floor/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      cache: "no-store",
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "전체 층 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    const result = (Array.isArray(data) ? data : []).map((row) => ({
      floor: row.Floor_Number,
      building: row.Building_Name,
      file: row.File || null,
    }))
    return NextResponse.json({ floors: result })
  }

  // 건물명으로 층 조회
  if (building) {
    const res = await fetch(
      `${API_BASE}/floor/${encodeURIComponent(building)}`,
      { 
        method: "GET", 
        headers: {
          "Authorization": `Bearer ${token}`
        },
        cache: "no-store" 
      }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: "해당 건물의 층 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    const result = (Array.isArray(data) ? data : []).map((row) => ({
      floor: row.Floor_Number,
      building: row.Building_Name,
      file: row.File || null,
    }))
    return NextResponse.json({ floors: result })
  }

  return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
}

// 층 추가 (POST)
export async function POST(request) {
  console.log("🏢 층 추가 API 시작")
  
  // 토큰 검증
  const token = verifyToken(request)
  console.log("🔑 토큰 검증 결과:", token ? "토큰 있음" : "토큰 없음")
  
  if (!token) {
    console.log("❌ 토큰 없음으로 401 반환")
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  const formData = await request.formData()
  console.log("📦 FormData 내용:")
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, typeof value === "object" ? value.name : value)
  }
  
  console.log("🌐 외부 API 호출:", `${API_BASE}/floor`)
  console.log("🔑 외부 API 토큰:", token)
  
  const res = await fetch(`${API_BASE}/floor`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData,
  })

  console.log("📡 외부 API 응답 상태:", res.status)
  console.log("📡 외부 API 응답 헤더:", Object.fromEntries(res.headers.entries()))

  const text = await res.text()
  console.log("📡 외부 API 응답 텍스트:", text)
  
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
      console.log("📡 외부 API 응답 JSON:", data)
    } catch (parseError) {
      console.log("❌ 외부 API 응답 JSON 파싱 실패:", parseError)
      data = { error: "외부 서버 응답이 올바른 JSON이 아닙니다." }
    }
  }

  if (!res.ok) {
    console.log("❌ 외부 API 오류 응답:", data)
    return NextResponse.json(
      { success: false, error: data.error || "외부 서버 오류" },
      { status: res.status }
    )
  }

  console.log("✅ 층 추가 성공:", data)
  return NextResponse.json({ success: true, ...data })
}

// 층 맵 파일 수정 (PUT)
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
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return NextResponse.json(
      { error: "floor_number와 building_name은 필수입니다." },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  const externalFormData = new FormData()
  externalFormData.append("file", file)
  externalFormData.append("building_name", building)
  externalFormData.append("floor_number", floor)

  const res = await fetch(
    `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
      building
    )}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: externalFormData,
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

// 층 삭제 (DELETE)
export async function DELETE(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  const { searchParams } = request.nextUrl
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return NextResponse.json("건물명과 층번호가 필요합니다.", { status: 400 })
  }

  try {
    const res = await fetch(
      `${API_BASE}/floor/${encodeURIComponent(floor)}/${encodeURIComponent(
        building
      )}`,
      { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    )
    const text = await res.text()
    console.log("📡 층 삭제 외부 API 응답:", { status: res.status, text })
    
    if (res.status === 200) {
      return NextResponse.json({ success: true, message: "층 삭제 성공" }, { status: 200 })
    } else if (res.status === 404) {
      return NextResponse.json({ success: false, error: "존재하지 않는 층입니다." }, { status: 404 })
    } else {
      return NextResponse.json({ success: false, error: "층 삭제 처리 중 오류" }, { status: 500 })
    }
  } catch (err) {
    console.error("❌ 층 삭제 오류:", err)
    return NextResponse.json({ success: false, error: "층 삭제 처리 중 오류" }, { status: 500 })
  }
}
