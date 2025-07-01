// category-route
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
    // data는 [{ Category_Name, Location: { x, y }, ... }, ...]
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: "서버 통신 오류" }, { status: 500 })
  }
}

// 카테고리 삭제 (DELETE)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get("building")
  const floor = searchParams.get("floor")

  if (!building || !floor) {
    return NextResponse.json(
      { error: "건물명, 층 정보를 입력하세요." },
      { status: 400 }
    )
  }

  let x, y, category_name
  try {
    const body = await request.json()
    x = body.x
    y = body.y
    category_name = body.category_name
  } catch (e) {
    return NextResponse.json(
      {
        error:
          "카테고리 좌표(x, y)와 이름(category_name)을 포함한 body가 필요합니다.",
      },
      { status: 400 }
    )
  }

  if (typeof x !== "number" || typeof y !== "number" || !category_name) {
    return NextResponse.json(
      {
        error: "카테고리 좌표(x, y)와 이름(category_name)을 정확히 입력하세요.",
      },
      { status: 400 }
    )
  }

  const apiUrl = `http://13.55.76.216:3000/category/${encodeURIComponent(
    building
  )}/${encodeURIComponent(floor)}`

  try {
    const res = await fetch(apiUrl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y, category_name }),
    })
    const text = await res.text()

    if (res.status === 200) {
      return NextResponse.json({ message: text }, { status: 200 })
    } else if (res.status === 404) {
      return NextResponse.json({ error: text }, { status: 404 })
    } else {
      return NextResponse.json({ error: text }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: "서버 통신 오류" }, { status: 500 })
  }
}
