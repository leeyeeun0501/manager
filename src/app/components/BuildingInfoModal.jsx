// 메인 화면 건물 정보 모달
"use client"

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
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 3000,
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          minWidth: "300px",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            건물 정보
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#999",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong>이름:</strong> {building.node_name || building.id}
          </div>

          {details && (
            <>
              <div style={{ marginBottom: "12px" }}>
                <strong>사진:</strong>
                <div style={{ marginTop: "8px" }}>
                  {images.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {images.slice(0, 3).map((imageUrl, idx) => (
                        <img
                          key={idx}
                          src={imageUrl}
                          alt={`건물 사진 ${idx + 1}`}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #eee",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none"
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#999", fontSize: "14px", fontStyle: "italic" }}>
                      사진 없음
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <strong>설명:</strong>
                <div style={{ marginTop: "8px", fontSize: "14px", color: "#666", lineHeight: "1.4" }}>
                  {details.Description || details.Desc || details.desc || "설명 없음"}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", color: "#666", cursor: "pointer", fontSize: "14px" }}
          >
            닫기
          </button>
        </div>
      </div>
      <div
        onClick={onClose}
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 2999 }}
      />
    </>
  )
}