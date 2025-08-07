export async function POST(request) {
  try {
    const { text, targetLang = "ko" } = await request.json()

    if (!text) {
      return Response.json(
        { error: "번역할 텍스트가 없습니다." },
        { status: 400 }
      )
    }

    // 간단한 번역 로직 (실제로는 Google Translate API 등을 사용해야 함)
    // 여기서는 예시로 간단한 매핑을 사용합니다
    const translations = {
      下次自动登录: "다음에 자동 로그인",
      "Next time automatic login": "다음에 자동 로그인",
      sorry: "죄송합니다",
      bug: "버그",
      feature: "기능",
      route_error: "경로 오류",
      "Route Guidance Error": "경로 안내 오류",
      "Feature Request": "기능 요청",
    }

    // 번역된 텍스트 찾기
    let translatedText = text
    for (const [original, translated] of Object.entries(translations)) {
      if (text.includes(original)) {
        translatedText = text.replace(original, translated)
      }
    }

    // 번역이 변경되지 않았다면 원본 텍스트 반환
    if (translatedText === text) {
      translatedText = `[번역됨] ${text}`
    }

    return Response.json({
      translatedText,
      originalText: text,
      targetLang,
    })
  } catch (error) {
    console.error("번역 API 오류:", error)
    return Response.json(
      { error: "번역 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
