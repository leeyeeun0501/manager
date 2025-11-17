import React, { useCallback } from "react"

const CUSTOM_DOMAIN_OPTION = "직접입력"
const DOMAIN_LIST = ["wsu.ac.kr", "naver.com", "gmail.com", "hanmail.net", "nate.com"]

export default function EmailInput({ value, onChange, styles }) {
  // isCustomDomain 상태를 value.domain 값에 따라 동적으로 결정
  const isCustomDomain = value.domain === CUSTOM_DOMAIN_OPTION

  const handleEmailIdChange = useCallback(
    (e) => {
      const newId = e.target.value
      // 함수형 업데이트를 사용하여 불필요한 value 의존성을 제거합니다.
      onChange((prev) => ({ ...prev, id: newId }))
    },
    [onChange]
  )

  const handleDomainChange = useCallback(
    (e) => {
      const newDomain = e.target.value
      onChange((prev) => {
        // '직접입력'을 선택하면 domain을 '직접입력'으로 설정하고,
        // customDomain 필드를 비워 사용자가 입력할 수 있도록 준비합니다.
        if (newDomain === CUSTOM_DOMAIN_OPTION) {
          return { ...prev, domain: CUSTOM_DOMAIN_OPTION, customDomain: "" }
        } else {
          return { ...prev, domain: newDomain, customDomain: undefined }
        }
      })
    },
    [onChange]
  )

  const handleCustomDomainChange = useCallback(
    (e) => {
      const newCustomDomain = e.target.value
      // 직접 입력하는 도메인 값을 customDomain 필드에 저장
      onChange((prev) => ({ ...prev, customDomain: newCustomDomain }))
    },
    [onChange]
  )

  return (
    <div className={styles["email-input-wrapper"]}>
      <input name="emailId" type="text" placeholder="이메일" value={value.id} onChange={handleEmailIdChange} required className={styles["email-id-input"]} autoComplete="off" />
      <span className={styles["email-at"]}>@</span>
      {isCustomDomain ? (
        <input name="customEmailDomain" type="text" placeholder="도메인 직접 입력" value={value.customDomain || ""} onChange={handleCustomDomainChange} required className={styles["email-domain-input"]} autoComplete="off" />
      ) : (
        <select name="emailDomain" value={value.domain} onChange={handleDomainChange} className={styles["email-domain-select"]} required>
          {DOMAIN_LIST.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
          <option value={CUSTOM_DOMAIN_OPTION}>{CUSTOM_DOMAIN_OPTION}</option>
        </select>
      )}
    </div>
  )
}