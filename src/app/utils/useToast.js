// 토스트 메시지 관리 훅
"use client"

import { useState, useCallback } from 'react'

/**
 * 토스트 메시지를 관리하는 커스텀 훅
 * @param {number} defaultDuration - 기본 토스트 표시 시간 (ms)
 * @returns {Object} 토스트 관련 상태와 함수들
 */
export const useToast = (defaultDuration = 3000) => {
  const [toastMessage, setToastMessage] = useState("")
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = useCallback((msg, duration = defaultDuration) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), duration)
  }, [defaultDuration])

  const hideToast = useCallback(() => {
    setToastVisible(false)
    setToastMessage("")
  }, [])

  return {
    toastMessage,
    toastVisible,
    showToast,
    hideToast,
  }
}

