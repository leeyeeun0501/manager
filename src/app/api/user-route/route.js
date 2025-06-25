import { NextResponse } from "next/server"

// 전체 사용자 조회 (GET)
export async function GET(request) {
  try {
    // 외부 서버에서 사용자 전체 목록 받아오기
    const res = await fetch("http://13.55.76.216:3001/user", { method: "GET" })
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "외부 서버 오류" },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json({ users: data.users || data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}

// 사용자 삭제 (DELETE: id를 body로 받음)
export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." },
        { status: 400 }
      )
    }
    // 외부 서버에 사용자 삭제 요청 보내기
    const res = await fetch(`http://13.55.76.216:3000/users/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: data.error || "외부 서버 오류" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    )
  }
}
