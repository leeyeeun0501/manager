import { NextResponse } from "next/server"

// 카테고리 위치 목록 조회 (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return NextResponse.json(
      { error: "건물명, 층 정보를 입력하세요." },
      { status: 400 }
    )
  }

  // 외부 서버에서 데이터 가져오기
  const apiUrl = `http://13.55.76.216:3000/category/manager/${encodeURIComponent(
    building
  )}/${encodeURIComponent(floor)}`
  try {
    const res = await fetch(apiUrl, { method: "GET", cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json(
        { error: "카테고리 위치 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    // data는 [{ Category_Name, Location: { x, y }, ... }, ...] 형태라고 가정
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: "서버 통신 오류" }, { status: 500 })
  }
}
