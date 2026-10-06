type Item = { label: string; value: number }

// 가로 막대 (분야별, 저자별, 별점 분포용)
export function HBars({ items, unit = '권' }: { items: Item[]; unit?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">아직 데이터가 없어요.</p>
  }
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-sm">
          <span className="w-24 flex-none truncate" title={i.label}>
            {i.label}
          </span>
          <div className="h-5 flex-1 rounded bg-gray-100">
            <div
              className="h-5 rounded bg-indigo-400"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
          <span className="w-12 flex-none text-right text-gray-600">
            {i.value}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  )
}

// 세로 막대 (월별, 연도별용)
export function VBars({ items }: { items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="flex items-end gap-1.5">
      {items.map((i) => (
        <div key={i.label} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="h-4 text-xs text-gray-600">{i.value > 0 ? i.value : ''}</span>
          <div
            className="w-full rounded-t bg-indigo-400"
            style={{ height: i.value > 0 ? Math.max(4, Math.round((i.value / max) * 120)) : 0 }}
          />
          <span className="text-xs text-gray-500">{i.label}</span>
        </div>
      ))}
    </div>
  )
}