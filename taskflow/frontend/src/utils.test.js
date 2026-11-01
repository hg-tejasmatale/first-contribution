import { describe, expect, it } from "vitest";

import { extractErrorMessage } from "./api.js";
import { buildTaskPayload, formatDueDate, isOverdue, nextStatus, todayISO } from "./utils.js";

describe("nextStatus", () => {
  it("cycles todo -> in_progress -> done -> todo", () => {
    expect(nextStatus("todo")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("done");
    expect(nextStatus("done")).toBe("todo");
  });
});

describe("todayISO", () => {
  it("formats a local date with zero padding", () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayISO(new Date(2026, 10, 1))).toBe("2026-11-01");
  });
});

describe("isOverdue", () => {
  const now = new Date(2026, 10, 1);
  it("is true for past due, unfinished tasks", () => {
    expect(isOverdue({ due_date: "2026-10-31", status: "todo" }, now)).toBe(true);
  });
  it("is false when due today or later", () => {
    expect(isOverdue({ due_date: "2026-11-01", status: "todo" }, now)).toBe(false);
    expect(isOverdue({ due_date: "2026-11-02", status: "in_progress" }, now)).toBe(false);
  });
  it("is false for finished tasks and tasks without a date", () => {
    expect(isOverdue({ due_date: "2020-01-01", status: "done" }, now)).toBe(false);
    expect(isOverdue({ due_date: null, status: "todo" }, now)).toBe(false);
  });
});

describe("formatDueDate", () => {
  it("handles missing dates", () => {
    expect(formatDueDate(null)).toBe("No due date");
  });
  it("includes the year for real dates", () => {
    expect(formatDueDate("2026-11-01")).toContain("2026");
  });
});

describe("buildTaskPayload", () => {
  it("trims text and normalises empty optional fields", () => {
    expect(
      buildTaskPayload({ title: "  Hello  ", description: " d ", priority: "low", due_date: "", project_id: "" }),
    ).toEqual({ title: "Hello", description: "d", priority: "low", due_date: null, project_id: null });
  });
  it("converts project_id to a number", () => {
    expect(
      buildTaskPayload({ title: "x", description: "", priority: "high", due_date: "2026-01-01", project_id: "3" })
        .project_id,
    ).toBe(3);
  });
});

describe("extractErrorMessage", () => {
  it("returns string details directly", () => {
    expect(extractErrorMessage({ detail: "Nope" }, "fallback")).toBe("Nope");
  });
  it("joins validation errors with the field name", () => {
    const body = { detail: [{ loc: ["body", "password"], msg: "too short" }, { loc: ["body"], msg: "bad" }] };
    expect(extractErrorMessage(body, "fallback")).toBe("password: too short; bad");
  });
  it("falls back when there is no detail", () => {
    expect(extractErrorMessage(null, "fallback")).toBe("fallback");
  });
});
