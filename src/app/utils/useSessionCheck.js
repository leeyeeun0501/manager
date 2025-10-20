// 개별 페이지에서 사용할 수 있는 세션 체크 훅
"use client"

import { useEffect } from 'react'
import { isAuthenticated, apiGet } from './apiHelper'

// 세션 체크 중복 방지
let isCheckingSession = false

// 페이지별 세션 체크 훅 (전역 세션 체크가 있으므로 간소화)
export const useSessionCheck = (checkInterval = 30000) => {
  useEffect(() => {
    // 로그인되지 않은 경우 체크하지 않음
    if (!isAuthenticated()) return

    // 전역 세션 체크가 이미 작동 중이므로 페이지별 체크는 간소화
    // 단, 페이지 로드 시 한 번만 체크
    const checkSession = async () => {
      if (isCheckingSession) return
      
      try {
        isCheckingSession = true
        // ✅ apiGet을 사용하여 fetchWithAuth의 401 인터셉터를 활용
        await apiGet('/api/session-check')
        // 전역 인터셉터가 처리하므로 여기서는 별도 처리 불필요
      } catch (error) {
        // 네트워크 오류는 무시
        console.warn('세션 체크 실패:', error)
      } finally {
        isCheckingSession = false
      }
    }

    // 페이지 로드 시 한 번만 체크 (전역 체크가 정기적으로 실행됨)
    checkSession()
  }, [])
}

// 페이지 로드 시 한 번만 세션 체크 (useSessionCheck와 동일)
export const useSessionCheckOnce = () => {
  return useSessionCheck()
}
