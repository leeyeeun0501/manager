// 전역 세션 관리 유틸리티
"use client"

import { handleTokenExpired, isAuthenticated, apiGet } from './apiHelper'

let sessionCheckInterval = null

// 전역 세션 체크 초기화
export const initGlobalSessionCheck = () => {
  if (typeof window === 'undefined') return
  console.log('전역 세션 체크가 초기화되었습니다.')
}

// 정기적인 세션 체크 (선택사항)
export const startSessionCheck = (intervalMs = 5000) => {
  if (typeof window === 'undefined') return

  // 이미 실행 중이면 중복 실행 방지
  if (sessionCheckInterval) {
    return sessionCheckInterval
  }

  const checkSession = async () => {
    if (!isAuthenticated()) return

    try {
      // ✅ apiGet을 사용하여 fetchWithAuth의 401 인터셉터를 활용
      const response = await apiGet('/api/session-check')
      if (!response.ok && response.status !== 401) {
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval)
          sessionCheckInterval = null
        }
      }
    } catch (error) {
      // 네트워크 오류는 무시
      // apiGet에서 401 에러 발생 시 reject되므로 catch 블록으로 들어올 수 있음
      console.warn('주기적인 세션 체크 실패:', error.message)
    }
  }

  // 즉시 한 번 체크
  checkSession()
  
  // 정기적으로 체크
  sessionCheckInterval = setInterval(checkSession, intervalMs)
  return sessionCheckInterval
}

// 세션 체크 중지
export const stopSessionCheck = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId)
  }
}
