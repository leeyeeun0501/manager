// navermap
"use client"
import { useEffect, useRef, useState } from "react"

// 마커 팝업 컨텐츠 생성
function createSpeechBubbleMarkerContent(userId) {
  return `
    <div style="
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 80px; /* 폭 넉넉히 */
      height: 34px;
      border-radius: 11px;
      background: white;
      border: 1.5px solid #111;
      font-weight: bold;
      font-size: 17px;
      color: #111;
      box-shadow: 0px 2px 6px rgba(0,0,0,0.08);
      text-align: center;
      word-break: normal; /* 변경 */
      white-space: nowrap; /* 변경 */
      line-height: 1.1;
      letter-spacing: 1px;
      padding: 2px 3px 0 3px;
    ">
      <span style="z-index:1; font-family:sans-serif;">${userId}</span>
      <div style="position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%);
        width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-top: 8px solid #111; z-index:0;"></div>
      <div style="position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
        width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent;
        border-top: 7px solid #fff; z-index:1;"></div>
    </div>
  `
}

export default function NaverMapSimple({ markers = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerObjsRef = useRef([])
  const pathRef = useRef(null)
  const buildingMarkersRef = useRef([])
  const buildingCirclesRef = useRef([])

  const [ready, setReady] = useState(false)
  const [pathData, setPathData] = useState([])
  const [buildingData, setBuildingData] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [buildingDetails, setBuildingDetails] = useState(null)

  // 네이버 지도 스크립트
  useEffect(() => {
    if (typeof window === "undefined") return
    const existing = document.querySelector('script[src*="maps.js"]')
    if (existing) {
      if (window.naver && window.naver.maps) setReady(true)
      else existing.addEventListener("load", () => setReady(true))
      return
    }
    const script = document.createElement("script")
    script.src =
      "https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=yxffktqahm"
    script.async = true
    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  // ready (스크립트 로드 완료) 후, 지도 객체 생성
  useEffect(() => {
    if (!ready) return
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapRef.current
    )
      return
    if (!mapInstanceRef.current) {
      let center = new window.naver.maps.LatLng(36.3377622, 127.4460928)
      let zoom = 17
      try {
        const saved = JSON.parse(localStorage.getItem("naverMapCenter"))
        if (saved && saved.lat && saved.lng) {
          center = new window.naver.maps.LatLng(saved.lat, saved.lng)
        }
        const savedZoom = parseInt(localStorage.getItem("naverMapZoom"), 10)
        if (!isNaN(savedZoom)) zoom = savedZoom
      } catch (e) {}
      const map = new window.naver.maps.Map(mapRef.current, { center, zoom })
      mapInstanceRef.current = map
      localStorage.removeItem("naverMapCenter")
      localStorage.removeItem("naverMapZoom")
    }
  }, [ready])

  // tower-route 데이터 가져오기
  useEffect(() => {
    const fetchPathData = async () => {
      try {
        const response = await fetch("/api/tower-route")
        const data = await response.json()
        if (data.nodes && Array.isArray(data.nodes)) {
          const filteredNodes = data.nodes.filter(
            (node) => node.id && !node.id.toString().includes("O")
          )
          setPathData(filteredNodes)
        }
      } catch (error) {
        console.error("경로 데이터 조회 실패:", error)
      }
    }

    fetchPathData()
  }, [])

  // 건물 데이터 가져오기
  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        setBuildingData([])

        const response = await fetch("/api/tower-route")
        const data = await response.json()

        if (data.nodes && Array.isArray(data.nodes)) {
          const buildings = data.nodes.filter(
            (node) => node.id && !node.id.toString().includes("O")
          )
          setBuildingData(buildings)
        } else {
          setBuildingData([])
        }
      } catch (error) {
        console.error("건물 데이터 조회 실패:", error)
        setBuildingData([])
      }
    }

    fetchBuildingData()
  }, [])

  // 건물 상세 정보 가져오기
  useEffect(() => {
    const fetchBuildingDetails = async () => {
      if (!selectedBuilding) {
        setBuildingDetails(null)
        return
      }

      try {
        setBuildingDetails(null)

        const buildingName = selectedBuilding.node_name || selectedBuilding.id

        const res = await fetch("/api/building-route")
        const json = await res.json()

        if (json.all && Array.isArray(json.all)) {
          const found = json.all.find((b) => {
            const buildingNames = [
              b.Building_Name,
              b.name,
              b.building_name,
              b.node_name,
            ].filter(Boolean)

            return buildingNames.some(
              (name) =>
                name === buildingName ||
                name.toLowerCase() === buildingName.toLowerCase()
            )
          })

          if (found) {
            setBuildingDetails(found)
          } else {
            setBuildingDetails(null)
          }
        } else {
          setBuildingDetails(null)
        }
      } catch (error) {
        console.error("건물 상세 정보 조회 실패:", error)
        setBuildingDetails(null)
      }
    }

    fetchBuildingDetails()
  }, [selectedBuilding])

  // markers가 변경될 때마다 마커 갱신
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapInstanceRef.current
    )
      return

    markerObjsRef.current.forEach((m) => m.setMap(null))
    markerObjsRef.current = []

    markers.forEach(({ id, name, last_location }) => {
      if (!last_location) return
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          last_location.lat,
          last_location.lng
        ),
        map: mapInstanceRef.current,
        title: name || id,
        icon: {
          content: createSpeechBubbleMarkerContent(name || id),
          size: new window.naver.maps.Size(42, 42),
          anchor: new window.naver.maps.Point(21, 38),
        },
      })
      markerObjsRef.current.push(marker)
    })
  }, [markers, ready])

  // 건물 마커 생성 및 클릭 이벤트
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapInstanceRef.current
    )
      return

    // 기존 건물 마커와 원 제거
    buildingMarkersRef.current.forEach((marker) => {
      if (marker && typeof marker.setMap === "function") {
        try {
          marker.setMap(null)
        } catch (e) {}
      }
    })
    buildingCirclesRef.current.forEach((circle) => {
      if (circle && typeof circle.setMap === "function") {
        try {
          circle.setMap(null)
        } catch (e) {}
      }
    })
    buildingMarkersRef.current = []
    buildingCirclesRef.current = []

    // buildingData가 없으면 마커 생성하지 않음
    if (!buildingData || buildingData.length === 0) return

    buildingData.forEach((building) => {
      // building-manage와 동일한 원형 마커
      const circle = new window.naver.maps.Circle({
        map: mapInstanceRef.current,
        center: new window.naver.maps.LatLng(building.x, building.y),
        radius: 2,
        fillColor: "#0066ff",
        fillOpacity: 1,
        strokeColor: "#0066ff",
        strokeOpacity: 1,
        strokeWeight: 2,
      })
      buildingCirclesRef.current.push(circle)

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(building.x, building.y),
        map: mapInstanceRef.current,
        draggable: false,
        opacity: 0.3,
        title: building.node_name || building.id,
        zIndex: 100,
        clickable: true,
        cursor: "pointer",
      })

      // 건물 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, "click", function () {
        setSelectedBuilding(building)
      })

      // 원 클릭 이벤트도 추가
      window.naver.maps.Event.addListener(circle, "click", function () {
        setSelectedBuilding(building)
      })

      buildingMarkersRef.current.push(marker)
    })
  }, [buildingData, ready])

  // pathData가 변경될 때마다 경로 마커 그리기
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !mapInstanceRef.current ||
      pathData.length === 0
    )
      return

    if (pathRef.current) {
      pathRef.current.forEach((marker) => marker.setMap(null))
    }

    const pathMarkers = pathData.map((node) => {
      return new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(node.x, node.y),
        map: mapInstanceRef.current,
        title: `경로점 ${node.id}`,
        icon: {
          content: `
            <div style="
              position: relative;
              width: 24px;
              height: 32px;
            ">
              <div style="
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 16px solid #0066FF;
              "></div>
              <div style="
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 12px solid #0066FF;
              "></div>
              <div style="
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 12px;
                height: 12px;
                background: white;
                border: 2px solid #0066FF;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 4px;
                  height: 4px;
                  background: #0066FF;
                  border-radius: 50%;
                "></div>
              </div>
            </div>
          `,
          size: new window.naver.maps.Size(24, 32),
          anchor: new window.naver.maps.Point(12, 32),
        },
      })
    })

    pathRef.current = pathMarkers
  }, [pathData, ready])

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{
          width: "140%",
          height: "650px",
          borderRadius: "18px",
          border: "1.5px solid #222",
          background: "#eee",
          margin: "0 auto",
          transform: "translateX(-15%)",
        }}
      />

      {/* 건물 정보 모달 */}
      {selectedBuilding && (
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
              onClick={() => {
                setSelectedBuilding(null)
                setBuildingDetails(null)
              }}
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
              <strong>이름:</strong>{" "}
              {selectedBuilding.node_name || selectedBuilding.id}
            </div>

            {/* 건물 이미지 */}
            {buildingDetails && (
              <div style={{ marginBottom: "12px" }}>
                <strong>사진:</strong>
                <div style={{ marginTop: "8px" }}>
                  {(() => {
                    let imageArr = []
                    if (
                      Array.isArray(buildingDetails.Image) &&
                      buildingDetails.Image.length > 0
                    ) {
                      imageArr = [...buildingDetails.Image]
                    } else if (
                      Array.isArray(buildingDetails.image) &&
                      buildingDetails.image.length > 0
                    ) {
                      imageArr = [...buildingDetails.image]
                    } else if (buildingDetails.image) {
                      imageArr = [buildingDetails.image]
                    } else if (buildingDetails.image_url) {
                      imageArr = [buildingDetails.image_url]
                    }

                    if (imageArr.length > 0) {
                      return (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {imageArr.slice(0, 3).map((imageUrl, idx) => (
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
                      )
                    } else {
                      return (
                        <div
                          style={{
                            color: "#999",
                            fontSize: "14px",
                            fontStyle: "italic",
                          }}
                        >
                          사진 없음
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>
            )}

            {/* 건물 설명 */}
            {buildingDetails && (
              <div style={{ marginBottom: "12px" }}>
                <strong>설명:</strong>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    color: "#666",
                    lineHeight: "1.4",
                  }}
                >
                  {buildingDetails.Description ||
                    buildingDetails.Desc ||
                    buildingDetails.desc ||
                    "설명 없음"}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              onClick={() => {
                setSelectedBuilding(null)
                setBuildingDetails(null)
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#666",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 모달 배경 오버레이 */}
      {selectedBuilding && (
        <div
          onClick={() => {
            setSelectedBuilding(null)
            setBuildingDetails(null)
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2999,
          }}
        />
      )}
    </div>
  )
}
