// API 요청 헬퍼 함수
// 토큰을 자동으로 포함하여 API 요청을 보내는 유틸리티 함수들

// 토큰을 가져오는 함수
const getToken = () => {
  if (typeof window === 'undefined') {
    return null
  }
  
  const token = localStorage.getItem('token')
  return token
}

// 세션 만료 상태 관리
let isSessionExpired = false

// 토큰 만료 처리 함수
export const handleTokenExpired = () => {
  if (typeof window !== 'undefined' && !isSessionExpired) {
    isSessionExpired = true
    
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('islogin')
    
    // 토큰 만료 알림 표시 (한 번만)
    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
    
    // 로그인 페이지로 리다이렉트 (강제 새로고침)
    window.location.replace('/login')
  }
}

// 세션 만료 상태 리셋 함수 (로그인 시 호출)
export const resetSessionExpired = () => {
  isSessionExpired = false
}

// 기본 fetch 함수에 토큰을 포함한 헤더 추가
const fetchWithAuth = async (url, options = {}) => {
  const token = getToken()
  
  // FormData인지 확인
  const isFormData = options.body instanceof FormData
  
  const headers = {
    // FormData가 아닐 때만 Content-Type을 application/json으로 설정
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  }
  
  // 토큰이 있으면 Authorization 헤더에 추가
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // 토큰이 만료되었거나 인증에 실패한 경우
  if (response.status === 401 || response.status === 419) {
    handleTokenExpired()
    throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
  }
  
  return response
}

// GET 요청
export const apiGet = async (url) => {
  return fetchWithAuth(url, { method: 'GET' })
}

// POST 요청
export const apiPost = async (url, data) => {
  const isFormData = data instanceof FormData
  
  return fetchWithAuth(url, {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  })
}

// PUT 요청
export const apiPut = async (url, data) => {
  const isFormData = data instanceof FormData
  
  return fetchWithAuth(url, {
    method: 'PUT',
    body: isFormData ? data : JSON.stringify(data),
  })
}

// DELETE 요청
export const apiDelete = async (url, data) => {
  return fetchWithAuth(url, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// JSON 응답을 파싱하는 헬퍼
export const parseJsonResponse = async (response) => {
  try {
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || data.error || '요청에 실패했습니다.')
    }
    return data
  } catch (error) {
    throw error
  }
}

// 토큰이 있는지 확인하는 함수
export const isAuthenticated = () => {
  return !!getToken()
}

// 로그아웃 함수
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('islogin')
    window.location.href = '/login'
  }
}
