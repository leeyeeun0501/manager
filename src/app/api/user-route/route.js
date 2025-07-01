// user-route
import { NextResponse } from "next/server"

// 전체 사용자 조회 (GET)
export async function GET(request) {
  try {
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

// 사용자 삭제 (DELETE)
export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`http://13.55.76.216:3001/user/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }), // body에 id 포함!
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("외부 서버 응답:", data)
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

// 회원정보 수정 (PUT)
export async function PUT(request) {
  try {
    const { id, pw, phone, email } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id는 필수입니다." },
        { status: 400 }
      )
    }
    if (!pw && !phone && !email) {
      return NextResponse.json(
        { success: false, error: "수정할 항목이 없습니다." },
        { status: 400 }
      )
    }

    const res = await fetch(`http://13.55.76.216:3001/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pw, phone, email }),
    })

    if (res.status === 404) {
      return NextResponse.json(
        { success: false, error: "해당 id의 사용자가 없습니다." },
        { status: 404 }
      )
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: data.error || "회원정보 수정 중 오류" },
        { status: 500 }
      )
    }

    const data = await res.json().catch(() => ({}))
    const msg =
      Array.isArray(data) && data.length > 0
        ? data[0]
        : data.message || "회원정보가 수정되었습니다."

    return NextResponse.json({ success: true, message: msg })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "회원정보 수정 중 오류" },
      { status: 500 }
    )
  }
}
