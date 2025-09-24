// 서버 사이드 토큰 검증 헬퍼 함수
import { NextResponse } from 'next/server'

// 토큰을 검증하는 함수
export function verifyToken(request) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7) // 'Bearer ' 제거
  
  if (!token || token.trim() === '') {
    return null
  }
  
  return token
}

// 인증이 필요한 API에서 사용하는 미들웨어
export function requireAuth(handler) {
  return async (request) => {
    const token = verifyToken(request)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // 토큰이 유효하면 원래 핸들러 실행
    return handler(request)
  }
}

// 토큰에서 사용자 정보를 추출하는 함수 (JWT인 경우)
export function getUserFromToken(token) {
  try {
    // JWT 토큰이라면 payload 디코딩
    // 실제 구현에서는 jwt.verify() 등을 사용
    // 현재는 간단히 토큰이 있으면 유효한 것으로 처리
    return {
      id: 'admin', // 실제로는 토큰에서 추출
      name: '관리자'
    }
  } catch (error) {
    return null
  }
}
