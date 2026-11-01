import { PRIORITY_LABELS, STATUS_LABELS, formatDueDate, isOverdue, nextStatus } from "../utils.js";

export default function TaskItem({ task, project, onUpdate, onDelete }) {
  const overdue = isOverdue(task);

  return (
    <li className={`card task ${task.status === "done" ? "done" : ""}`}>
      <button
        className={`status-btn ${task.status}`}
        onClick={() => onUpdate(task.id, { status: nextStatus(task.status) })}
        title="Click to change status"
        aria-label={`Status: ${STATUS_LABELS[task.status]}. Click to change.`}
      >
        {STATUS_LABELS[task.status]}
      </button>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="muted small">{task.description}</div>}
        <div className="meta">
          <span className={`pill priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
          <span className={overdue ? "overdue" : "muted small"}>
            {overdue ? "Overdue · " : ""}
            {formatDueDate(task.due_date)}
          </span>
          {project && (
            <span className="pill" style={{ background: project.color, color: "#fff" }}>
              {project.name}
            </span>
          )}
        </div>
      </div>

      <button className="btn danger small" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
        Delete
      </button>
    </li>
  );
}
