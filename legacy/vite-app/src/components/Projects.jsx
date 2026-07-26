import { useRef } from "react";
import { PROJECTS } from "../data.js";

export default function Projects() {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const step = Math.min(track.clientWidth * 0.8, 360);
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="section" id="projects">
      <div className="section-head section-head--center">
        <h2 className="section-title">Projects</h2>
      </div>

      <div className="carousel-wrap">
        <button className="car-btn car-prev" aria-label="Previous" onClick={() => scroll(-1)}>
          &#8249;
        </button>

        <div className="carousel" ref={trackRef}>
          {PROJECTS.map((p) => {
            const live = p.url && p.url !== "#";
            const linkProps = live ? { target: "_blank", rel: "noopener" } : {};
            return (
              <article className="tile reveal" key={p.title}>
                <div className="tile-meta">
                  <div className="tile-title">{p.title}</div>
                  <div className="tile-tag">{p.tag}</div>
                  <a className="btn tile-btn" href={p.url} {...linkProps}>
                    {live ? "Visit Live" : "View Project"}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <button className="car-btn car-next" aria-label="Next" onClick={() => scroll(1)}>
          &#8250;
        </button>
      </div>

      <div className="section-foot">
        <a href="#" className="link-all">See All Projects &#8594;</a>
      </div>
    </section>
  );
}
