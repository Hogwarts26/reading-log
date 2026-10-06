'use client'
import { useState } from 'react'

type Props = {
  value: number
  onChange?: (v: number) => void // 없으면 읽기 전용
  criteria?: Record<string, string>
  size?: number
}

export default function StarRating({ value, onChange, criteria = {}, size = 30 }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const [tapped, setTapped] = useState<number | null>(null)
  const tip = hover ?? tapped
  const shown = hover ?? value

  return (
    <div className="relative inline-block pt-9" onMouseLeave={() => setHover(null)}>
      {tip && criteria[String(tip)] && (
        <div className="absolute left-0 top-0 z-10 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow">
          {tip}점 · {criteria[String(tip)]}
        </div>
      )}
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            style={{ fontSize: size, lineHeight: 1 }}
            className={n <= shown ? 'text-yellow-400' : 'text-gray-300'}
            onMouseEnter={() => setHover(n)}
            onClick={() => {
              setTapped(n)
              onChange?.(n === value ? 0 : n) // 같은 별을 다시 누르면 취소
            }}
            aria-label={`${n}점`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}