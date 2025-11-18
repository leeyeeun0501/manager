// 이메일 입력 컴포넌트
import React, { useState, useCallback } from "react"

export default function EmailInput({ value, onChange, styles }) {
  // isCustomDomain 상태를 value.domain 값에 따라 동적으로 결정
  const isCustomDomain = value.domain === "직접입력"

  const handleEmailIdChange = useCallback(
    (e) => {
      onChange({ ...value, id: e.target.value })
    },
    [onChange, value] // value가 변경될 때마다 함수가 재생성되도록 의존성 배열에 추가
  )

  const handleDomainChange = useCallback(
    (e) => {
      const newDomain = e.target.value
      // '직접입력'을 선택하면 domain을 '직접입력'으로 설정하고,
      // customDomain 필드를 비워 사용자가 입력할 수 있도록 준비합니다.
      if (newDomain === "직접입력") {
        onChange({ ...value, domain: "직접입력", customDomain: "" })
      } else {
        onChange({ ...value, domain: newDomain, customDomain: undefined })
      }
    },
    [onChange, value] // value가 변경될 때마다 함수가 재생성되도록 의존성 배열에 추가
  )

  const handleCustomDomainChange = useCallback(
    (e) => {
      // 직접 입력하는 도메인 값을 customDomain 필드에 저장
      onChange({ ...value, customDomain: e.target.value })
    },
    [onChange, value] // value가 변경될 때마다 함수가 재생성되도록 의존성 배열에 추가
  )

  return (
    <div className={styles["email-input-wrapper"]}>
      <input name="emailId" type="text" placeholder="이메일" value={value.id} onChange={handleEmailIdChange} required className={styles["email-id-input"]} autoComplete="off" />
      <span className={styles["email-at"]}>@</span>
      {isCustomDomain ? (
        <input name="customEmailDomain" type="text" placeholder="도메인 직접 입력" value={value.customDomain || ""} onChange={handleCustomDomainChange} required className={styles["email-domain-input"]} autoComplete="off" />
      ) : (
        <select name="emailDomain" value={value.domain} onChange={handleDomainChange} className={styles["email-domain-select"]} required>
          <option value="wsu.ac.kr">wsu.ac.kr</option>
          <option value="naver.com">naver.com</option>
          <option value="gmail.com">gmail.com</option>
          <option value="hanmail.net">hanmail.net</option>
          <option value="nate.com">nate.com</option>
          <option value="직접입력">직접입력</option>
        </select>
      )}
    </div>
  )
}