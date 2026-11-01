const TOKEN_KEY = "taskflow_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable; session just won't persist */
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** FastAPI returns `detail` as a string or as a list of validation errors. */
export function extractErrorMessage(body, fallback) {
  const detail = body && body.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field && field !== "body" ? `${field}: ${d.msg}` : d.msg;
      })
      .join("; ");
  }
  return fallback;
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = {};
  let payload;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized();
    throw new ApiError(res.status, extractErrorMessage(data, `Request failed (${res.status})`));
  }
  return data;
}

export const api = {
  register: (email, full_name, password) =>
    request("/auth/register", { method: "POST", body: { email, full_name, password }, auth: false }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", form: { username: email, password }, auth: false }),
  me: () => request("/auth/me"),

  listTasks: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined && value !== false) {
        params.set(key, String(value));
      }
    });
    const qs = params.toString();
    return request(`/tasks${qs ? `?${qs}` : ""}`);
  },
  taskStats: () => request("/tasks/stats"),
  createTask: (task) => request("/tasks", { method: "POST", body: task }),
  updateTask: (id, changes) => request(`/tasks/${id}`, { method: "PATCH", body: changes }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  listProjects: () => request("/projects"),
  createProject: (project) => request("/projects", { method: "POST", body: project }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
};
