type Bucket = { n: number; r: number; g: number; b: number }

// 표지 이미지에서 가장 많이 쓰인 선명한 색을 뽑아요 (#rrggbb)
export async function extractDominantColor(blob: Blob): Promise<string> {
  const bmp = await createImageBitmap(blob)
  const size = 48
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return '#9ca3af'
  ctx.drawImage(bmp, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const buckets = new Map<string, Bucket>()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a < 200) continue
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max
    // 너무 어둡거나, 거의 흰색이거나, 회색에 가까운 색은 제외
    if (max < 40 || min > 225 || sat < 0.25) continue
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    cur.n++
    cur.r += r
    cur.g += g
    cur.b += b
    buckets.set(key, cur)
  }

  let best: Bucket | null = null
  for (const v of buckets.values()) {
    if (!best || v.n > best.n) best = v
  }
  if (!best) return '#9ca3af' // 뽑을 색이 없으면 회색
  const chosen: Bucket = best
  const hex = (sum: number) =>
    Math.round(sum / chosen.n).toString(16).padStart(2, '0')
  return `#${hex(chosen.r)}${hex(chosen.g)}${hex(chosen.b)}`
}