import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ProjectSidebar from "../components/ProjectSidebar.jsx";
import StatsBar from "../components/StatsBar.jsx";
import TaskForm from "../components/TaskForm.jsx";
import TaskItem from "../components/TaskItem.jsx";

const EMPTY_FILTERS = { status: "", priority: "", search: "", overdue: false };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const projectsById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const refresh = useCallback(async () => {
    try {
      const [taskList, statData] = await Promise.all([
        api.listTasks({ ...filters, project_id: projectId }),
        api.taskStats(),
      ]);
      setTasks(taskList);
      setStats(statData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, projectId]);

  useEffect(() => {
    api.listProjects().then(setProjects).catch((err) => setError(err.message));
  }, []);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(refresh, filters.search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [refresh, filters.search]);

  async function run(action) {
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const createTask = async (payload) => {
    await api.createTask(payload);
    await refresh();
  };
  const updateTask = (id, changes) => run(() => api.updateTask(id, changes));
  const deleteTask = (id) => run(() => api.deleteTask(id));

  const createProject = async (payload) => {
    const project = await api.createProject(payload);
    setProjects((prev) => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)));
  };
  const deleteProject = (id) =>
    run(async () => {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (projectId === id) setProjectId("");
    });

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="layout">
      <header className="topbar">
        <h1>TaskFlow</h1>
        <div className="row">
          <span className="muted">{user?.full_name}</span>
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="content">
        <ProjectSidebar
          projects={projects}
          selectedId={projectId}
          onSelect={setProjectId}
          onCreate={createProject}
          onDelete={deleteProject}
        />

        <main className="main">
          <StatsBar stats={stats} />
          <TaskForm projects={projects} defaultProjectId={projectId} onCreate={createTask} />

          <div className="card filters row">
            <input
              className="grow"
              placeholder="Search tasks…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              aria-label="Search tasks"
            />
            <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} aria-label="Filter by status">
              <option value="">Any status</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <select value={filters.priority} onChange={(e) => setFilter("priority", e.target.value)} aria-label="Filter by priority">
              <option value="">Any priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <label className="check">
              <input type="checkbox" checked={filters.overdue} onChange={(e) => setFilter("overdue", e.target.checked)} />
              Overdue only
            </label>
            {hasFilters && (
              <button className="btn" onClick={() => setFilters(EMPTY_FILTERS)}>Clear</button>
            )}
          </div>

          {error && <div className="error" role="alert">{error}</div>}

          {loading ? (
            <p className="muted">Loading…</p>
          ) : tasks.length === 0 ? (
            <p className="muted empty">{hasFilters ? "No tasks match these filters." : "No tasks yet — add your first one above."}</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  project={projectsById[task.project_id]}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
