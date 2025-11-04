// 파일 선택 아이콘 버튼 컴포넌트
"use client"
import React from "react"
import { FaPaperclip } from "react-icons/fa"
import styles from "./floor-manage.module.css"

export default function ClipFileInput({
  onFileChange,
  fileName,
  fileInputRef,
  accept = ".svg",
}) {
  return (
    <div className={styles.clipFileInputRoot}>
      <input
        type="text"
        readOnly
        value={fileName || ""}
        placeholder="SVG 파일"
        className={`${styles.clipFileInputDisplay} ${fileName ? styles.fileSelected : ""}`}
        onClick={() => fileInputRef?.current?.click()}
      />
      <button
        type="button"
        onClick={() => fileInputRef?.current?.click()}
        className={styles.clipFileIconButton}
        aria-label="SVG 파일 업로드"
      >
        <FaPaperclip size={22} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className={styles.clipFileInputHidden}
        onChange={onFileChange}
      />
    </div>
  )
}

