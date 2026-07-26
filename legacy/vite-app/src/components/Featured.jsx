import { FEATURED, gradient } from "../data.js";

export default function Featured() {
  return (
    <section className="section" id="featured">
      <div className="section-head">
        <h2 className="section-title">Featured</h2>
      </div>

      <div className="featured-grid">
        {FEATURED.map((f) => {
          const live = f.url && f.url !== "#";
          const linkProps = live ? { target: "_blank", rel: "noopener" } : {};
          return (
            <a href={f.url || "#"} className="feature reveal" key={f.title} {...linkProps}>
              <div className="swatch" style={{ background: gradient(f.swatch) }}></div>
              <div className="play">&#9658;</div>
              <div className="feature-body">
                <div className="feature-tag">{f.tag}</div>
                <div className="feature-title">{f.title}</div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="section-foot">
        <a href="#" className="link-all">See All Featured &#8594;</a>
      </div>
    </section>
  );
}
