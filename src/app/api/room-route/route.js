// room-route
// 건물 설명/이름 수정 (PATCH)
export async function PATCH(request) {
  const body = await request.json()
  // body: { type: "building", building, desc?, newName? }

  if (body.type === "building") {
    // 건물 설명/이름 수정
    const patchBody = {}
    if (body.desc !== undefined) patchBody.desc = body.desc
    if (body.newName !== undefined) patchBody.newName = body.newName

    const res = await fetch(
      `http://13.55.76.216:3000/buildings/${body.building}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "수정 실패" },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { success: false, error: "잘못된 요청" },
    { status: 400 }
  )
}
