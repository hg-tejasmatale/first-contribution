from datetime import date, timedelta

from .conftest import register_and_login


def make_task(client, auth, **overrides):
    payload = {"title": "Write docs", **overrides}
    r = client.post("/api/tasks", json=payload, headers=auth)
    assert r.status_code == 201, r.text
    return r.json()


def test_create_and_get_task(client, auth):
    task = make_task(client, auth, description="README", priority="high")
    assert task["status"] == "todo"
    assert task["priority"] == "high"
    r = client.get(f"/api/tasks/{task['id']}", headers=auth)
    assert r.status_code == 200
    assert r.json()["title"] == "Write docs"


def test_create_task_validation(client, auth):
    r = client.post("/api/tasks", json={"title": ""}, headers=auth)
    assert r.status_code == 422
    r = client.post("/api/tasks", json={"title": "x", "status": "bogus"}, headers=auth)
    assert r.status_code == 422


def test_update_task_partial(client, auth):
    task = make_task(client, auth)
    r = client.patch(f"/api/tasks/{task['id']}", json={"status": "done"}, headers=auth)
    assert r.status_code == 200
    assert r.json()["status"] == "done"
    assert r.json()["title"] == "Write docs"


def test_clear_due_date(client, auth):
    task = make_task(client, auth, due_date="2030-01-01")
    r = client.patch(f"/api/tasks/{task['id']}", json={"due_date": None}, headers=auth)
    assert r.status_code == 200
    assert r.json()["due_date"] is None


def test_delete_task(client, auth):
    task = make_task(client, auth)
    assert client.delete(f"/api/tasks/{task['id']}", headers=auth).status_code == 204
    assert client.get(f"/api/tasks/{task['id']}", headers=auth).status_code == 404


def test_users_cannot_see_each_others_tasks(client, auth):
    task = make_task(client, auth)
    other = register_and_login(client, email="b@example.com", name="Bea")
    assert client.get(f"/api/tasks/{task['id']}", headers=other).status_code == 404
    assert client.patch(f"/api/tasks/{task['id']}", json={"title": "hax"}, headers=other).status_code == 404
    assert client.delete(f"/api/tasks/{task['id']}", headers=other).status_code == 404
    assert client.get("/api/tasks", headers=other).json() == []


def test_filters(client, auth):
    make_task(client, auth, title="Alpha", priority="low")
    make_task(client, auth, title="Beta", priority="high", status="done")
    make_task(client, auth, title="Gamma bug", description="crash on save", priority="high")

    assert len(client.get("/api/tasks", headers=auth).json()) == 3
    assert len(client.get("/api/tasks?status=done", headers=auth).json()) == 1
    assert len(client.get("/api/tasks?priority=high", headers=auth).json()) == 2
    assert [t["title"] for t in client.get("/api/tasks?search=crash", headers=auth).json()] == ["Gamma bug"]
    assert client.get("/api/tasks?status=bogus", headers=auth).status_code == 422


def test_sort_order_high_priority_first_done_last(client, auth):
    make_task(client, auth, title="low", priority="low")
    make_task(client, auth, title="done-high", priority="high", status="done")
    make_task(client, auth, title="high", priority="high")
    titles = [t["title"] for t in client.get("/api/tasks", headers=auth).json()]
    assert titles == ["high", "low", "done-high"]


def test_overdue_filter_and_stats(client, auth):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    make_task(client, auth, title="late", due_date=yesterday)
    make_task(client, auth, title="late but done", due_date=yesterday, status="done")
    make_task(client, auth, title="future", due_date=tomorrow, status="in_progress")

    overdue = client.get("/api/tasks?overdue=true", headers=auth).json()
    assert [t["title"] for t in overdue] == ["late"]

    stats = client.get("/api/tasks/stats", headers=auth).json()
    assert stats == {
        "total": 3,
        "todo": 1,
        "in_progress": 1,
        "done": 1,
        "overdue": 1,
        "completion_rate": 33.3,
    }


def test_stats_empty(client, auth):
    stats = client.get("/api/tasks/stats", headers=auth).json()
    assert stats["total"] == 0
    assert stats["completion_rate"] == 0.0
