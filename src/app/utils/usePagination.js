// 페이징 관리 훅
"use client"

import { useState, useEffect, useMemo } from 'react'

/**
 * 페이징을 관리하는 커스텀 훅
 * @param {Array} data - 페이징할 데이터 배열
 * @param {number} itemsPerPage - 페이지당 아이템 수
 * @param {string} storageKey - localStorage에 저장할 키 (선택사항)
 * @returns {Object} 페이징 관련 상태와 함수들
 */
export const usePagination = (data = [], itemsPerPage = 10, storageKey = null) => {
  const [currentPage, setCurrentPage] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      return saved ? Number(saved) : 1
    }
    return 1
  })

  // 저장된 페이지 번호를 localStorage에 저장
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, currentPage.toString())
    }
  }, [currentPage, storageKey])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(data.length / itemsPerPage))
  }, [data.length, itemsPerPage])

  const pagedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return data.slice(startIdx, startIdx + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  // 페이지가 전체 페이지 수보다 클 때 자동 조정
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const goToLastPage = () => {
    setCurrentPage(totalPages)
  }

  return {
    currentPage,
    totalPages,
    pagedData,
    goToPage,
    goToPrevPage,
    goToNextPage,
    goToFirstPage,
    goToLastPage,
    setCurrentPage, // 직접 설정도 가능하도록
  }
}

