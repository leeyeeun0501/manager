// API 요청 헬퍼 함수
// 토큰을 자동으로 포함하여 API 요청을 보내는 유틸리티 함수들

// 토큰을 가져오는 함수
const getToken = () => {
  if (typeof window === 'undefined') {
    console.log('🔑 getToken - window가 undefined (서버 사이드)')
    return null
  }
  
  console.log('🔑 getToken - localStorage 확인 시작')
  console.log('🔑 getToken - localStorage 전체 키:', Object.keys(localStorage))
  
  const token = localStorage.getItem('token')
  console.log('🔑 getToken - localStorage에서 토큰 가져오기:', token ? '토큰 있음' : '토큰 없음')
  console.log('🔑 getToken - 토큰 값:', token)
  console.log('🔑 getToken - 토큰 길이:', token ? token.length : 0)
  console.log('🔑 getToken - 토큰 타입:', typeof token)
  
  if (token) {
    console.log('🔑 getToken - 토큰 첫 10자리:', token.substring(0, 10) + '...')
  }
  
  return token
}

// 기본 fetch 함수에 토큰을 포함한 헤더 추가
const fetchWithAuth = async (url, options = {}) => {
  const token = getToken()
  console.log('🔑 apiHelper - 요청 URL:', url)
  console.log('🔑 apiHelper - 토큰 확인:', token ? '토큰 있음' : '토큰 없음')
  console.log('🔑 apiHelper - 토큰 길이:', token ? token.length : 0)
  console.log('🔑 apiHelper - 토큰 값:', token)
  
  // FormData인지 확인
  const isFormData = options.body instanceof FormData
  console.log('🔑 apiHelper - FormData 여부:', isFormData)
  
  const headers = {
    // FormData가 아닐 때만 Content-Type을 application/json으로 설정
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  }
  
  // 토큰이 있으면 Authorization 헤더에 추가 (강제로 추가)
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`
    console.log('🔑 apiHelper - Authorization 헤더 추가됨:', `Bearer ${token}`)
  } else {
    console.log('❌ apiHelper - 토큰이 없어서 Authorization 헤더 추가 안됨')
    console.log('❌ apiHelper - 토큰 값:', token)
    console.log('❌ apiHelper - 토큰 타입:', typeof token)
  }
  
  console.log('🔑 apiHelper - 최종 헤더:', headers)
  console.log('🔑 apiHelper - Authorization 헤더 확인:', headers['Authorization'])
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // 토큰이 만료되었거나 인증에 실패한 경우
  if (response.status === 401) {
    console.log('❌ apiHelper - 401 인증 오류 발생')
    console.log('❌ apiHelper - 응답 상태:', response.status)
    console.log('❌ apiHelper - 응답 헤더:', Object.fromEntries(response.headers.entries()))
    try {
      const errorText = await response.text()
      console.log('❌ apiHelper - 오류 응답 내용:', errorText)
    } catch (e) {
      console.log('❌ apiHelper - 오류 응답 파싱 실패:', e.message)
    }
    throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
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
  console.log('🔑 apiPost - FormData 여부:', isFormData)
  
  return fetchWithAuth(url, {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
    // headers는 fetchWithAuth에서 처리하므로 여기서는 설정하지 않음
  })
}

// PUT 요청
export const apiPut = async (url, data) => {
  const isFormData = data instanceof FormData
  console.log('🔑 apiPut - FormData 여부:', isFormData)
  
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