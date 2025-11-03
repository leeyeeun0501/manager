// 검색 및 필터링 관리 훅
"use client"

import { useState, useMemo } from 'react'

/**
 * 검색 및 필터링을 관리하는 커스텀 훅
 * @param {Array} data - 필터링할 데이터 배열
 * @returns {Object} 검색 관련 상태와 함수들
 */
export const useSearchFilter = (data = []) => {
  const [search, setSearch] = useState("")

  const filteredData = useMemo(() => {
    if (!search.trim()) {
      return data
    }
    
    const keyword = search.toLowerCase()
    return data.filter((item) =>
      Object.values(item).some((val) =>
        (val ?? "").toString().toLowerCase().includes(keyword)
      )
    )
  }, [data, search])

  const clearSearch = () => {
    setSearch("")
  }

  return {
    search,
    setSearch,
    filteredData,
    clearSearch,
  }
}

/**
 * 카테고리 필터링을 관리하는 커스텀 훅
 * @param {Array} data - 필터링할 데이터 배열
 * @param {string} categoryKey - 카테고리 필드명
 * @param {string} defaultCategory - 기본 카테고리 (예: 'all')
 * @returns {Object} 카테고리 필터링 관련 상태와 함수들
 */
export const useCategoryFilter = (data = [], categoryKey = 'category', defaultCategory = 'all') => {
  const [category, setCategory] = useState(defaultCategory)

  const filteredData = useMemo(() => {
    if (!category || category === defaultCategory) {
      return data
    }
    return data.filter(item => item[categoryKey] === category)
  }, [data, category, categoryKey, defaultCategory])

  const categories = useMemo(() => {
    const cats = [...new Set(data.map(item => item[categoryKey]).filter(Boolean))]
    return [
      { value: defaultCategory, label: '전체' },
      ...cats.map(cat => ({ value: cat, label: cat }))
    ]
  }, [data, categoryKey, defaultCategory])

  return {
    category,
    setCategory,
    filteredData,
    categories,
  }
}

