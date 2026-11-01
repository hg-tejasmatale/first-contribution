"""Populate the database with a demo user and sample data.

Usage (from the backend/ directory):  python seed.py
Demo login: demo@taskflow.dev / password123
"""
from datetime import date, timedelta

from sqlalchemy import select

from app import models
from app.database import Base, SessionLocal, engine
from app.security import hash_password


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.scalar(select(models.User).where(models.User.email == "demo@taskflow.dev")):
            print("Demo user already exists; nothing to do.")
            return
        user = models.User(
            email="demo@taskflow.dev",
            full_name="Demo User",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.flush()

        work = models.Project(name="Work", color="#4f46e5", owner_id=user.id)
        home = models.Project(name="Home", color="#059669", owner_id=user.id)
        db.add_all([work, home])
        db.flush()

        today = date.today()
        db.add_all(
            [
                models.Task(title="Prepare sprint demo", description="Slides + live walkthrough",
                            status="in_progress", priority="high",
                            due_date=today + timedelta(days=2), owner_id=user.id, project_id=work.id),
                models.Task(title="Fix flaky CI test", status="todo", priority="high",
                            due_date=today - timedelta(days=1), owner_id=user.id, project_id=work.id),
                models.Task(title="Review teammate's PR", status="todo", priority="medium",
                            due_date=today, owner_id=user.id, project_id=work.id),
                models.Task(title="Buy groceries", status="todo", priority="low",
                            owner_id=user.id, project_id=home.id),
                models.Task(title="Book dentist appointment", status="done", priority="medium",
                            owner_id=user.id, project_id=home.id),
                models.Task(title="Write release notes", status="done", priority="low",
                            owner_id=user.id, project_id=work.id),
            ]
        )
        db.commit()
        print("Seeded demo user demo@taskflow.dev / password123")


if __name__ == "__main__":
    main()
