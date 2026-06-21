import React, { useState } from 'react'
import { createPortal } from 'react-dom'

export function CursorTooltip({ label, children }) {
  const [position, setPosition] = useState(null)

  const followPointer = event => {
    setPosition({ x: event.clientX, y: event.clientY - 8 })
  }

  const showForKeyboard = event => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setPosition({ x: bounds.left + bounds.width / 2, y: bounds.top - 8 })
  }

  return (
    <span
      className="cursor-tooltip-anchor"
      onMouseEnter={followPointer}
      onMouseMove={followPointer}
      onMouseLeave={() => setPosition(null)}
      onFocus={showForKeyboard}
      onBlur={() => setPosition(null)}
    >
      {children}
      {position && createPortal(
        <span
          className="cursor-action-tooltip"
          role="tooltip"
          style={{ left: position.x, top: position.y }}
        >
          {label}
        </span>,
        document.body
      )}
    </span>
  )
}
