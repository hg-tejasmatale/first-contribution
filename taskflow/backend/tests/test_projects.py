from .conftest import register_and_login


def test_project_crud(client, auth):
    r = client.post("/api/projects", json={"name": "Work", "color": "#112233"}, headers=auth)
    assert r.status_code == 201
    pid = r.json()["id"]

    r = client.patch(f"/api/projects/{pid}", json={"name": "Office"}, headers=auth)
    assert r.json()["name"] == "Office"
    assert r.json()["color"] == "#112233"

    assert [p["name"] for p in client.get("/api/projects", headers=auth).json()] == ["Office"]
    assert client.delete(f"/api/projects/{pid}", headers=auth).status_code == 204
    assert client.get("/api/projects", headers=auth).json() == []


def test_invalid_color_rejected(client, auth):
    r = client.post("/api/projects", json={"name": "X", "color": "red"}, headers=auth)
    assert r.status_code == 422


def test_task_in_project_and_project_delete_unassigns(client, auth):
    pid = client.post("/api/projects", json={"name": "Work"}, headers=auth).json()["id"]
    task = client.post(
        "/api/tasks", json={"title": "T", "project_id": pid}, headers=auth
    ).json()
    assert len(client.get(f"/api/tasks?project_id={pid}", headers=auth).json()) == 1

    client.delete(f"/api/projects/{pid}", headers=auth)
    refreshed = client.get(f"/api/tasks/{task['id']}", headers=auth).json()
    assert refreshed["project_id"] is None


def test_cannot_use_other_users_project(client, auth):
    pid = client.post("/api/projects", json={"name": "Mine"}, headers=auth).json()["id"]
    other = register_and_login(client, email="b@example.com", name="Bea")
    r = client.post("/api/tasks", json={"title": "T", "project_id": pid}, headers=other)
    assert r.status_code == 400
    assert client.delete(f"/api/projects/{pid}", headers=other).status_code == 404
