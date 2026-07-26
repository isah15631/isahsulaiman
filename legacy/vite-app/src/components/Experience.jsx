import { EXPERIENCE } from "../data.js";

export default function Experience() {
  return (
    <section className="section section-alt" id="experience">
      <div className="section-head">
        <h2 className="section-title">Experience</h2>
      </div>

      <ul className="exp-list">
        {EXPERIENCE.map((e) => (
          <li className="exp-row reveal" key={e.year + e.role}>
            <div className="exp-date">
              {e.year}
              <small>{e.month}</small>
            </div>
            <div className="exp-role">{e.role}</div>
            <div className="exp-org">{e.org}</div>
            <a href={e.url} className="btn">Details</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
