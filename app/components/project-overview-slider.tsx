'use client'

import { useEffect, useMemo, useState } from 'react'

type Slide = { id: string; image_url: string }

export default function ProjectOverviewSlider({
  images,
  fallback,
  alt,
}: {
  images: Slide[]
  fallback?: string | null
  alt: string
}) {
  const slides = useMemo(() => {
    const list = [...images]
    if (!list.length && fallback) return [{ id: 'fallback', image_url: fallback }]
    return list
  }, [images, fallback])

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => setIndex(0), [slides.length])

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [slides.length, paused])

  if (!slides.length) return null

  const previous = () => setIndex((current) => (current - 1 + slides.length) % slides.length)
  const next = () => setIndex((current) => (current + 1) % slides.length)

  return (
    <div
      className="project-overview-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="project-overview-slide" key={slides[index].id}>
        <img src={slides[index].image_url} alt={`${alt} — ảnh ${index + 1}`} />
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className="project-overview-slider-arrow prev" onClick={previous} aria-label="Ảnh trước">‹</button>
          <button type="button" className="project-overview-slider-arrow next" onClick={next} aria-label="Ảnh tiếp theo">›</button>
          <div className="project-overview-slider-counter">{index + 1}/{slides.length}</div>
          <div className="project-overview-slider-dots">
            {slides.map((slide, i) => (
              <button key={slide.id} type="button" className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Xem ảnh ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
