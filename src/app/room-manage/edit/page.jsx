// room-manage/edit
"use client"
import React, { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Menu from "../../components/menu"
import styles from "../room-manage.module.css"

export default function RoomManageEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const building = searchParams.get("building") || ""
  const floor = searchParams.get("floor") || ""
  const [menuOpen, setMenuOpen] = useState(false)

  const [svgRaw, setSvgRaw] = useState("")
  const [svgViewBox, setSvgViewBox] = useState({ x: 0, y: 0, width: 400, height: 400 })
  const [edges, setEdges] = useState([])
  const [svgNodes, setSvgNodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const CANVAS_WIDTH = 1000
  const CANVAS_HEIGHT = 700
  const mapContainerRef = useRef(null)

  function parseNodeInfo(fullId) {
    const parts = (fullId || "").split("@")
    if (parts.length < 3) return { building: "", floor: "", node: "" }
    return { building: parts[0], floor: parts[1], node: parts[2] }
  }

  function processSvg(svgXml) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const svgEl = doc.querySelector("svg")
    if (!svgEl) return svgXml

    const existingViewBox = svgEl.getAttribute("viewBox")
    if (existingViewBox) {
      const parts = existingViewBox.split(/[\s,]+/).map(Number)
      if (parts.length === 4) {
        setSvgViewBox({ x: parts[0], y: parts[1], width: parts[2], height: parts[3] })
        return svgXml
      }
    }

    const width = parseFloat(svgEl.getAttribute("width")) || 400
    const height = parseFloat(svgEl.getAttribute("height")) || 400
    const viewBoxStr = `0 0 ${width} ${height}`
    svgEl.setAttribute("viewBox", viewBoxStr)
    setSvgViewBox({ x: 0, y: 0, width, height })
    svgEl.removeAttribute("width")
    svgEl.removeAttribute("height")

    return doc.documentElement.outerHTML
  }

  function parseSvgNodes(svgXml, buildingName, floorName) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgXml, "image/svg+xml")
    const nodes = []

    const navigationLayer =
      doc.querySelector('g[id="Navigation_Nodes"]') ||
      doc.querySelector('g[id="navigation_nodes"]') ||
      doc.querySelector('g[id="Navigation_nodes"]') ||
      doc.querySelector('g[id="navigation-nodes"]')

    if (!navigationLayer) {
      return []
    }

    const allElements = navigationLayer.querySelectorAll("*[id]")
    allElements.forEach((element) => {
      const nodeSuffix = element.getAttribute("id")
      if (!nodeSuffix) return
      const fullNodeId = `${buildingName}@${floorName}@${nodeSuffix}`

      let x = 0, y = 0, width = 0, height = 0
      switch (element.tagName.toLowerCase()) {
        case "rect":
          x = parseFloat(element.getAttribute("x") || 0)
          y = parseFloat(element.getAttribute("y") || 0)
          width = parseFloat(element.getAttribute("width") || 0)
          height = parseFloat(element.getAttribute("height") || 0)
          break
        case "circle":
          x = parseFloat(element.getAttribute("cx") || 0)
          y = parseFloat(element.getAttribute("cy") || 0)
          width = height = parseFloat(element.getAttribute("r") || 0) * 2
          break
        case "ellipse":
          x = parseFloat(element.getAttribute("cx") || 0)
          y = parseFloat(element.getAttribute("cy") || 0)
          width = parseFloat(element.getAttribute("rx") || 0) * 2
          height = parseFloat(element.getAttribute("ry") || 0) * 2
          break
        case "line":
          x = parseFloat(element.getAttribute("x1") || 0)
          y = parseFloat(element.getAttribute("y1") || 0)
          const x2 = parseFloat(element.getAttribute("x2") || 0)
          const y2 = parseFloat(element.getAttribute("y2") || 0)
          width = Math.abs(x2 - x)
          height = Math.abs(y2 - y)
          break
        case "polygon":
        case "polyline":
          const points = element.getAttribute("points") || ""
          const pointsArray = points.split(/[\s,]+/).filter((p) => p).map(Number)
          if (pointsArray.length >= 2) {
            const xCoords = pointsArray.filter((_, i) => i % 2 === 0)
            const yCoords = pointsArray.filter((_, i) => i % 2 === 1)
            x = Math.min(...xCoords)
            y = Math.min(...yCoords)
            width = Math.max(...xCoords) - x
            height = Math.max(...yCoords) - y
          }
          break
        case "path":
          const d = element.getAttribute("d") || ""
          const matches = d.match(/[ML]\s*([0-9.-]+)\s*,?\s*([0-9.-]+)/g)
          if (matches && matches.length > 0) {
            const coords = matches.map((m) => {
              const nums = m.replace(/[ML]\s*/, "").split(/[\s,]+/).map(Number)
              return { x: nums[0] || 0, y: nums[1] || 0 }
            })
            const xCoords = coords.map((c) => c.x)
            const yCoords = coords.map((c) => c.y)
            x = Math.min(...xCoords)
            y = Math.min(...yCoords)
            width = Math.max(...xCoords) - x
            height = Math.max(...yCoords) - y
          }
          break
        case "text":
          x = parseFloat(element.getAttribute("x") || 0)
          y = parseFloat(element.getAttribute("y") || 0)
          width = element.textContent ? element.textContent.length * 8 : 50
          height = 20
          break
        case "g":
          const transform = element.getAttribute("transform") || ""
          const translateMatch = transform.match(/translate\(([^)]+)\)/)
          if (translateMatch) {
            const translateValues = translateMatch[1].split(/[\s,]+/).map(Number)
            x = translateValues[0] || 0
            y = translateValues[1] || 0
          }
          width = height = 20
          break
        default:
          x = parseFloat(element.getAttribute("x") || 0)
          y = parseFloat(element.getAttribute("y") || 0)
          width = parseFloat(element.getAttribute("width") || 20)
          height = parseFloat(element.getAttribute("height") || 20)
      }

      nodes.push({ id: fullNodeId, x, y, width, height, element: element.tagName.toLowerCase(), layer: "Navigation_Nodes" })
    })

    return nodes
  }

  useEffect(() => {
    if (!building || !floor) return

    setLoading(true)
    setError("")

    fetch(`/api/map-route?building=${encodeURIComponent(building)}&floor=${encodeURIComponent(floor)}`)
      .then((res) => res.json())
      .then((data) => {
        const fileList = Array.isArray(data) ? data : [data]
        const rawSvgUrl = fileList[0]?.File
        const nodesInfo = fileList[0]?.nodes || {}
        let edgesInfo = fileList[0]?.edges

        if (!edgesInfo) {
          edgesInfo = []
          Object.entries(nodesInfo).forEach(([from, arr]) => {
            arr.forEach((edgeObj) => {
              const to = typeof edgeObj === "string" ? edgeObj : (edgeObj.node || edgeObj.to)
              if (to) edgesInfo.push({ from, to })
            })
          })
        }

        if (rawSvgUrl) {
          const svgUrl = rawSvgUrl + (rawSvgUrl.includes("?") ? "&" : "?") + "ts=" + Date.now()
          setSvgRaw("")
          setSvgNodes([])
          setEdges([])

          fetch(svgUrl)
            .then((res) => res.text())
            .then((svgXml) => {
              const processedSvg = processSvg(svgXml)
              setSvgRaw(processedSvg)
              setEdges(edgesInfo)
              const parsedNodes = parseSvgNodes(svgXml, building, floor)
              setSvgNodes(parsedNodes)
            })
            .catch(() => {
              setSvgRaw("")
              setSvgNodes([])
              setEdges([])
              setError("도면을 불러오지 못했습니다.")
            })
        } else {
          setSvgRaw("")
          setSvgNodes([])
          setEdges([])
          setError("해당 건물/층의 맵 파일을 찾을 수 없습니다.")
        }
      })
      .catch(() => {
        setSvgRaw("")
        setSvgNodes([])
        setEdges([])
        setError("맵 데이터를 불러오지 못했습니다.")
      })
      .finally(() => setLoading(false))
  }, [building, floor])

  return (
    <div className={styles["room-root"]}>
      <span className={styles["room-header"]}>도면 편집 페이지</span>
      <Menu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {building && floor && (
        <div style={{ 
          textAlign: "center", 
          marginBottom: "16px", 
          fontSize: "16px", 
          color: "#2574f5", 
          fontWeight: "600" 
        }}>
          건물: {building} | 층: {floor}층
        </div>
      )}
      <div className={styles["room-content"]}>
        <div className={styles["room-manage-map-wrap"]}>
          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: "6px 14px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#fff",
                backgroundColor: "#2574f5",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "8px"
              }}
            >
              뒤로가기
            </button>
          </div>
          <div
            style={{ position: "relative", width: CANVAS_WIDTH, height: CANVAS_HEIGHT, border: "1px solid #ddd", backgroundColor: "#f8f9fa", overflow: "hidden" }}
          >
            {loading && (
              <div className={styles["room-manage-canvas-placeholder"]}>맵 로딩 중...</div>
            )}
            {!loading && (!building || !floor) && (
              <div className={styles["room-manage-canvas-placeholder"]}>URL의 building/floor 파라미터가 필요합니다.</div>
            )}
            {!loading && building && floor && !svgRaw && (
              <div className={styles["room-manage-canvas-placeholder"]}>{error || "해당 건물/층의 맵 파일을 찾을 수 없습니다."}</div>
            )}

            {!loading && building && floor && svgRaw && (() => {
              const scale = Math.min(CANVAS_WIDTH / svgViewBox.width, CANVAS_HEIGHT / svgViewBox.height)
              const offsetX = (CANVAS_WIDTH - svgViewBox.width * scale) / 2
              const offsetY = (CANVAS_HEIGHT - svgViewBox.height * scale) / 2

              return (
                <div
                  ref={mapContainerRef}
                  style={{
                    width: svgViewBox.width,
                    height: svgViewBox.height,
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                    transformOrigin: "top left",
                    position: "relative",
                  }}
                >
                  <div
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                    dangerouslySetInnerHTML={{ __html: svgRaw }}
                  />

                  <svg
                    style={{ position: "absolute", top: 0, left: 0, width: svgViewBox.width, height: svgViewBox.height, pointerEvents: "none", zIndex: 2 }}
                  >
                    {edges && edges.map((edge, idx) => {
                      const fromInfo = parseNodeInfo(edge.from)
                      const toInfo = parseNodeInfo(edge.to)
                      if (
                        fromInfo.building !== building ||
                        fromInfo.floor !== floor ||
                        toInfo.building !== building ||
                        toInfo.floor !== floor
                      ) {
                        return null
                      }
                      const fromNode = svgNodes.find((node) => node.id === edge.from)
                      const toNode = svgNodes.find((node) => node.id === edge.to)
                      if (!fromNode || !toNode) return null
                      return (
                        <line key={idx} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="red" strokeWidth={2} opacity={0.85} />
                      )
                    })}
                  </svg>

                  {svgNodes.map((node, index) => (
                    <div
                      key={`node-overlay-${node.id}-${index}`}
                      style={{
                        position: "absolute",
                        left: `${node.x - node.width / 2}px`,
                        top: `${node.y - node.height / 2}px`,
                        width: `${node.width}px`,
                        height: `${node.height}px`,
                        border: "1px solid #007bff",
                        backgroundColor: "rgba(0, 123, 255, 0.08)",
                        borderRadius: 4,
                      }}
                      title={`ID: ${node.id}`}
                    />
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
