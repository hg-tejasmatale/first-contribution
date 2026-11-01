import { useState } from "react";

const COLORS = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed"];

export default function ProjectSidebar({ projects, selectedId, onSelect, onCreate, onDelete }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await onCreate({ name: name.trim(), color: COLORS[projects.length % COLORS.length] });
      setName("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <aside className="sidebar">
      <h3>Projects</h3>
      <ul className="project-list">
        <li>
          <button className={`project ${selectedId === "" ? "active" : ""}`} onClick={() => onSelect("")}>
            All tasks
          </button>
        </li>
        {projects.map((p) => (
          <li key={p.id} className="project-row">
            <button className={`project ${selectedId === p.id ? "active" : ""}`} onClick={() => onSelect(p.id)}>
              <span className="dot" style={{ background: p.color }} />
              {p.name}
            </button>
            <button className="link danger-text" onClick={() => onDelete(p.id)} aria-label={`Delete project ${p.name}`}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="row">
        <input
          className="grow"
          placeholder="New project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          aria-label="New project name"
        />
        <button className="btn" type="submit">Add</button>
      </form>
      {error && <div className="error" role="alert">{error}</div>}
    </aside>
  );
}
