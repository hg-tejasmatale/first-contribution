import { useState } from "react";

import { buildTaskPayload } from "../utils.js";

export default function TaskForm({ projects, defaultProjectId, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onCreate(
        buildTaskPayload({
          title,
          description,
          priority,
          due_date: dueDate,
          project_id: projectId || defaultProjectId,
        }),
      );
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card task-form" onSubmit={handleSubmit}>
      <div className="row">
        <input
          className="grow"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          aria-label="Task title"
        />
        <button className="btn primary" type="submit" disabled={busy}>
          Add task
        </button>
      </div>
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        aria-label="Task description"
      />
      <div className="row">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
          <option value="">{defaultProjectId ? "Current project" : "No project"}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
    </form>
  );
}
