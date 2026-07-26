import { STACK } from "../data.js";

export default function Stack() {
  return (
    <section className="section" id="stack">
      <div className="section-head">
        <h2 className="section-title">Stack</h2>
        <p className="section-note">Tools I build with</p>
      </div>

      <div className="stack-grid">
        {STACK.map((g) => (
          <div className="stack-col reveal" key={g.group}>
            <h3 className="stack-label">{g.group}</h3>
            <ul className="stack-chips">
              {g.items.map((i) => (
                <li className="chip" key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
