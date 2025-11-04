// 메인 화면 건물 정보 모달
"use client"

import styles from "./management.module.css";

export default function BuildingInfoModal({
  building,
  details,
  onClose,
}) {
  if (!building) return null

  const getImages = () => {
    if (!details) return []
    if (Array.isArray(details.Image) && details.Image.length > 0) {
      return details.Image
    }
    if (Array.isArray(details.image) && details.image.length > 0) {
      return details.image
    }
    if (details.image) {
      return [details.image]
    }
    if (details.image_url) {
      return [details.image_url]
    }
    return []
  }

  const images = getImages()

  return (
    <>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>건물 정보</h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.infoSection}>
            <strong>이름:</strong> {building.node_name || building.id}
          </div>

          {details && (
            <>
              <div className={styles.infoSection}>
                <strong>사진:</strong>
                {images.length > 0 ? (
                  <div className={styles.photoGrid}>
                    {images.slice(0, 3).map((imageUrl, idx) => (
                      <img
                        key={idx}
                        src={imageUrl}
                        alt={`건물 사진 ${idx + 1}`}
                        className={styles.photoThumbnail}
                        onError={(e) => { e.target.style.display = "none" }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noPhoto}>사진 없음</div>
                )}
              </div>
              <div className={styles.infoSection}>
                <strong>설명:</strong>
                <div className={styles.description}>
                  {details.Description || details.Desc || details.desc || "설명 없음"}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.footerCloseButton}>
            닫기
          </button>
        </div>
      </div>
      <div onClick={onClose} className={styles.modalOverlay} />
    </>
  )
}

