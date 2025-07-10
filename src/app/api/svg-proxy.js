// /pages/api/svg-proxy.js
export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send("Missing URL")

  try {
    const response = await fetch(url)
    const svg = await response.text()
    res.setHeader("Content-Type", "image/svg+xml")
    res.status(200).send(svg)
  } catch (err) {
    console.error("SVG 프록시 실패:", err)
    res.status(500).send("SVG fetch error")
  }
}
