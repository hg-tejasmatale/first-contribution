export const STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** Next status when the user clicks the status button on a task. */
export function nextStatus(status) {
  const order = ["todo", "in_progress", "done"];
  const index = order.indexOf(status);
  return order[(index + 1) % order.length];
}

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A task is overdue when it has a due date before today and is not done. */
export function isOverdue(task, now = new Date()) {
  if (!task.due_date || task.status === "done") return false;
  return task.due_date < todayISO(now);
}

export function formatDueDate(isoDate) {
  if (!isoDate) return "No due date";
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Trim the title and drop empty optional fields before sending to the API. */
export function buildTaskPayload({ title, description, priority, due_date, project_id }) {
  return {
    title: title.trim(),
    description: (description || "").trim(),
    priority,
    due_date: due_date || null,
    project_id: project_id ? Number(project_id) : null,
  };
}
