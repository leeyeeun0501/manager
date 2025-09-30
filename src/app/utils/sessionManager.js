// 전역 세션 관리 유틸리티
"use client"

import { handleTokenExpired } from './apiHelper'

// 전역 fetch 인터셉터 설정
let originalFetch = null
let isIntercepting = false
let isHandlingExpired = false

// 세션 만료 처리 상태 리셋 함수
export const resetSessionHandling = () => {
  isHandlingExpired = false
}

// fetch를 가로채서 401 응답을 처리하는 함수
const interceptFetch = () => {
  if (typeof window === 'undefined' || originalFetch || isIntercepting) return

  isIntercepting = true
  originalFetch = window.fetch
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)
      
      // 401 또는 419 응답 처리
      if (response.status === 401 || response.status === 419) {
        // 중복 처리 방지
        if (!response._handled && !isHandlingExpired) {
          response._handled = true
          isHandlingExpired = true
          handleTokenExpired()
          // 세션 만료 처리 후 상태 리셋 (다음 요청을 위해)
          setTimeout(() => {
            isHandlingExpired = false
          }, 1000)
        }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }
}

// XMLHttpRequest를 가로채서 401 응답을 처리하는 함수
const interceptXHR = () => {
  if (typeof window === 'undefined') return

  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url
    this._handled = false
    return originalOpen.apply(this, [method, url, ...args])
  }

  XMLHttpRequest.prototype.send = function(data) {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 4) {
        if ((this.status === 401 || this.status === 419) && !this._handled && !isHandlingExpired) {
          this._handled = true
          isHandlingExpired = true
          handleTokenExpired()
          // 세션 만료 처리 후 상태 리셋 (다음 요청을 위해)
          setTimeout(() => {
            isHandlingExpired = false
          }, 1000)
        }
      }
    })
    return originalSend.apply(this, [data])
  }
}

// 전역 세션 체크 초기화
export const initGlobalSessionCheck = () => {
  if (typeof window === 'undefined') return

  // 이미 초기화되었으면 중복 초기화 방지
  if (isIntercepting) return

  // fetch 인터셉터 설정
  interceptFetch()
  
  // XMLHttpRequest 인터셉터 설정
  interceptXHR()
  
  console.log('전역 세션 체크가 초기화되었습니다.')
}

// 정기적인 세션 체크 (선택사항)
export const startSessionCheck = (intervalMs = 10000) => {
  if (typeof window === 'undefined') return

  const checkSession = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // 간단한 세션 체크 API 호출
      const response = await fetch('/api/session-check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 419) {
        if (!isHandlingExpired) {
          isHandlingExpired = true
          handleTokenExpired()
          // 세션 만료 처리 후 상태 리셋 (다음 요청을 위해)
          setTimeout(() => {
            isHandlingExpired = false
          }, 1000)
        }
      }
    } catch (error) {
      // 네트워크 오류는 무시
      console.warn('세션 체크 실패:', error)
    }
  }

  // 즉시 한 번 체크
  checkSession()
  
  // 정기적으로 체크
  return setInterval(checkSession, intervalMs)
}

// 세션 체크 중지
export const stopSessionCheck = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId)
  }
}
