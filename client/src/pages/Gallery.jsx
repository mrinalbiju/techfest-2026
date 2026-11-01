import { useEffect, useState } from "react";

const photos = [
  { src: "/images/hackathon.webp", caption: "HackNight 2025" },
  { src: "/images/robowars.webp", caption: "RoboWars arena" },
  { src: "/images/workshop.webp", caption: "Web Dev Bootcamp" },
  { src: "/images/quiz.webp", caption: "Tech Quiz finals" },
  { src: "/images/stage.webp", caption: "Opening night" },
  { src: "/images/expo.webp", caption: "Project expo" },
];

export default function Gallery() {
  const [index, setIndex] = useState(null);

  // Keyboard control for the lightbox
  useEffect(() => {
    if (index === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  return (
    <section>
      <h1>Gallery</h1>
      <div className="gallery">
        {photos.map((p, i) => (
          <button key={p.src} className="thumb" onClick={() => setIndex(i)}>
            <img src={p.src} alt={p.caption} width="800" height="533" loading="lazy" decoding="async" />
            <span>{p.caption}</span>
          </button>
        ))}
      </div>
      {index !== null && (
        <div className="lightbox" onClick={() => setIndex(null)}>
          <img src={photos[index].src} alt={photos[index].caption} />
          <p>{photos[index].caption} — use ← → or Esc</p>
        </div>
      )}
    </section>
  );
}
