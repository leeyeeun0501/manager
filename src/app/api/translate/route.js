// translate-route
import { TranslationServiceClient } from "@google-cloud/translate"

export async function POST(request) {
  try {
    const { texts, targetLang = "ko" } = await request.json()
    if (!Array.isArray(texts) || texts.length === 0) {
      return Response.json(
        { error: "번역할 텍스트 배열이 없습니다." },
        { status: 400 }
      )
    }

    const projectId = process.env.GOOGLE_PROJECT_ID
    if (!projectId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error(
        "Google Cloud 인증 정보가 .env.local 파일에 설정되지 않았습니다. (GOOGLE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS)"
      )
      return Response.json(
        { error: "서버에 API 키가 설정되지 않았습니다." },
        { status: 500 }
      )
    }

    const location = "global"
    const translationClient = new TranslationServiceClient()

    const translate = async (text) => {
      if (!text) return { translatedText: "", originalText: text }

      const requestPayload = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: "text/plain",
        targetLanguageCode: targetLang,
      }

      const [response] = await translationClient.translateText(requestPayload)
      const translation = response.translations[0]

      return {
        translatedText: translation.translatedText,
        originalText: text,
        sourceLang: translation.detectedLanguageCode,
      }
    }

    const results = await Promise.all(texts.map(translate))

    return Response.json({
      results,
      targetLang,
    })
  } catch (error) {
    console.error("Google 번역 API 라우트에서 오류 발생:", error.message)
    return Response.json(
      { error: error.message || "번역 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
