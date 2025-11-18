// 강의실 요청 API
import { NextResponse } from "next/server"
import { API_BASE } from "../apibase"
import { verifyToken } from "../../utils/authHelper"

// 강의실 전체 데이터 조회 (GET)
export async function GET(request) {
  // 토큰 검증
  const token = verifyToken(request)
  if (!token) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    )
  }

  try {
    const res = await fetch(`${API_BASE}/room`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "강의실 정보를 불러올 수 없습니다." },
        { status: res.status }
      )
    }
    const data = await res.json()
    // data.data 구조 처리
    const roomData = data.data?.data?.rooms || data.data?.rooms || data.rooms || data
    const rooms = Array.isArray(roomData)
      ? roomData.map((room) => ({
          building: room.Building_Name,
          floor: room.Floor_Number,
          name: room.Room_Name,
          description: room.Room_Description,
          room_user: room.Room_User,
          user_phone: room.User_Phone,
          user_email: room.User_Email,
        }))
      : []
    return NextResponse.json({ rooms })
  } catch (err) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}