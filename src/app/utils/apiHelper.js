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
let isHandlingTokenExpired = false

// 토큰 만료 처리 함수
export const handleTokenExpired = () => {
  // 중복 실행 방지
  if (typeof window === 'undefined') return; // 서버 사이드에서는 실행하지 않음
  if (isHandlingTokenExpired) { // 클라이언트에서만 중복 실행 방지
    return;
  }
  isHandlingTokenExpired = true
    
  // 로그아웃 함수 재사용
  logout(false) // 페이지 이동은 여기서 직접 처리하므로 false 전달

    // 토큰 만료 알림 표시 (한 번만)
    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
    
    // 로그인 페이지로 리다이렉트 (강제 새로고침)
    window.location.replace('/login')
  }

// 세션 만료 상태 리셋 함수 (로그인 시 호출)
export const resetSessionExpired = () => {
  isHandlingTokenExpired = false
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

  // 401 Unauthorized 에러를 여기서 공통으로 처리
  if (response.status === 401) {
    handleTokenExpired()
    return Promise.reject(new Error("세션 만료")) // 이후 .then() 체인 실행 중단
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

// 다양한 API 응답 구조에서 사용자 '목록' 데이터를 추출하는 함수
export const extractUserListData = (data) => {
  if (!data) return [];

  const users = 
    data.users?.data ||
    data.data?.data?.users ||
    data.data?.users ||
    data.users ||
    data.data ||
    data;

  // 최종 결과가 배열인지 확인하여 반환
  return Array.isArray(users) ? users : [];
}

// 토큰이 있는지 확인하는 함수
export const isAuthenticated = () => {
  return !!getToken()
}

// 로그아웃 함수
export const logout = (redirect = true) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('islogin')
    if (redirect) {
      window.location.href = '/login'
    }
  }
}

// 다양한 API 응답 구조에서 사용자 데이터 배열/객체를 추출하는 함수
export const extractUserData = (data) => {
  if (!data) return null

  // 1. data.success && data.user 형태
  if (data.success && data.user) {
    if (Array.isArray(data.user)) return data.user[0]
    if (data.user.data && Array.isArray(data.user.data)) return data.user.data[0]
    return data.user
  }
  // 2. data.data.user 형태
  if (data.data?.user) {
    return Array.isArray(data.data.user) ? data.data.user[0] : data.data.user
  }
  // 3. data.data 형태 (배열 또는 객체)
  if (data.data) {
    return Array.isArray(data.data) ? data.data[0] : data.data
  }
  // 4. data 자체가 배열인 경우
  if (Array.isArray(data)) return data[0]

  // 5. 최상위 객체
  return data
}

// 전화번호 하이픈 자동 삽입 함수
export const formatPhoneNumber = (value) => {
  if (!value) return ""
  const number = value.replace(/[^0-9]/g, "")
  if (number.length < 4) return number
  if (number.length < 7) return number.replace(/(\d{3})(\d{1,3})/, "$1-$2")
  if (number.length < 11) return number.replace(/(\d{3})(\d{3,4})(\d{1,4})/, "$1-$2-$3")
  return number.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
}
