import React from 'react'

export function SparrowIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C9 3 6 5.5 6 9c0 2 .8 3.8 2.1 5L5 21l4-2 3 2 3-2 4 2-3.1-7C17.2 12.8 18 11 18 9c0-3.5-3-6-6-6z" fill={color} opacity="0.9"/>
      <circle cx="10" cy="8.5" r="1" fill="#0a0a0f"/>
      <circle cx="14" cy="8.5" r="1" fill="#0a0a0f"/>
    </svg>
  )
}
