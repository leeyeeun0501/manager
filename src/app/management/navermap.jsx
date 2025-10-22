// navermap
"use client"
import { useEffect, useRef, useState } from "react"
import { apiGet, parseJsonResponse } from "../utils/apiHelper";
import BuildingInfoModal from "../components/BuildingInfoModal";
import styles from "./management.module.css";

const NAVER_MAPS_SCRIPT_URL = "https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=yxffktqahm";

// 마커 팝업 컨텐츠 생성
function createSpeechBubbleMarkerContent(userId) {
  return `
    <div class="${styles.speechBubble}">
      <span class="${styles.userId}">${userId}</span>
      <div class="${styles.triangleBorder}"></div>
      <div class="${styles.triangleFill}"></div>
    </div>
  `
}

// 지도 요소 스타일 상수
const BUILDING_CIRCLE_OPTIONS = {
  radius: 2,
  fillColor: "#0066ff",
  fillOpacity: 1,
  strokeColor: "#0066ff",
  strokeOpacity: 1,
  strokeWeight: 2,
};

const BUILDING_MARKER_OPTIONS = {
  draggable: false,
  opacity: 0.3,
  zIndex: 100,
  clickable: true,
  cursor: "pointer",
};


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
    script.src = NAVER_MAPS_SCRIPT_URL;
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

  // tower-route 데이터(경로 및 건물) 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiGet("/api/tower-route")
        const data = await parseJsonResponse(response)

        if (data.nodes && Array.isArray(data.nodes)) {
          const filteredNodes = data.nodes.filter((node) => {
            // 기본 필터: id가 있고 "O"가 포함되지 않아야 함
            if (!node.id || node.id.toString().includes("O")) {
              return false;
            }
            // "~문"으로 끝나는 노드 제외
            const nodeName = node.node_name || node.name || node.id || "";
            return !nodeName.toString().endsWith("문");
          });
          // 경로점과 건물 데이터를 한 번에 설정
          setPathData(filteredNodes);
          setBuildingData(filteredNodes);
        }
      } catch (error) {
        console.error("Failed to fetch tower-route data:", error);
        setPathData([]);
        setBuildingData([]);
      }
    };

    fetchData();
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

        const res = await apiGet("/api/building-route")
        const json = await parseJsonResponse(res)

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
        ...BUILDING_CIRCLE_OPTIONS,
        map: mapInstanceRef.current,
        center: new window.naver.maps.LatLng(building.x, building.y),
      })
      buildingCirclesRef.current.push(circle)

      const marker = new window.naver.maps.Marker({
        ...BUILDING_MARKER_OPTIONS,
        position: new window.naver.maps.LatLng(building.x, building.y),
        map: mapInstanceRef.current,
        title: building.node_name || building.id,
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
              <div class="${styles.pathMarker}">
                <div class="${styles.pathMarkerTriangleBase}"></div>
                <div class="${styles.pathMarkerTriangleInner}"></div>
                <div class="${styles.pathMarkerCircle}"><div class="${styles.pathMarkerCircleDot}"></div></div>
              </div>`,
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

      {selectedBuilding && (
        <BuildingInfoModal
          building={selectedBuilding}
          details={buildingDetails}
          onClose={() => {
            setSelectedBuilding(null);
            setBuildingDetails(null);
          }}
        />
      )}
    </div>
  )
}
