// 개별 페이지에서 사용할 수 있는 세션 체크 훅
"use client"

import { useEffect } from 'react'
import { isAuthenticated, handleTokenExpired } from './apiHelper'

// 세션 체크 중복 방지
let isCheckingSession = false

// 페이지별 세션 체크 훅
export const useSessionCheck = (checkInterval = 30000) => {
  useEffect(() => {
    // 로그인되지 않은 경우 체크하지 않음
    if (!isAuthenticated()) return

    const checkSession = async () => {
      if (isCheckingSession) return
      
      try {
        isCheckingSession = true
        const response = await fetch('/api/session-check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.status === 401 || response.status === 419) {
          handleTokenExpired()
        }
      } catch (error) {
        // 네트워크 오류는 무시
        console.warn('세션 체크 실패:', error)
      } finally {
        isCheckingSession = false
      }
    }

    // 즉시 한 번 체크
    checkSession()
    
    // 정기적으로 체크
    const interval = setInterval(checkSession, checkInterval)

    return () => {
      clearInterval(interval)
    }
  }, [checkInterval])
}

// 페이지 로드 시 한 번만 세션 체크
export const useSessionCheckOnce = () => {
  useEffect(() => {
    if (!isAuthenticated()) return

    const checkSession = async () => {
      if (isCheckingSession) return
      
      try {
        isCheckingSession = true
        const response = await fetch('/api/session-check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.status === 401 || response.status === 419) {
          handleTokenExpired()
        }
      } catch (error) {
        console.warn('세션 체크 실패:', error)
      } finally {
        isCheckingSession = false
      }
    }

    checkSession()
  }, [])
}
