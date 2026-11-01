from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _get_owned_task(db: Session, task_id: int, user: models.User) -> models.Task:
    task = db.get(models.Task, task_id)
    if task is None or task.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task


def _validate_project(db: Session, project_id: int | None, user: models.User) -> None:
    if project_id is None:
        return
    project = db.get(models.Project, project_id)
    if project is None or project.owner_id != user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown project_id")


@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(
    status_filter: schemas.Status | None = Query(default=None, alias="status"),
    priority: schemas.Priority | None = None,
    project_id: int | None = None,
    search: str | None = Query(default=None, max_length=100),
    overdue: bool = False,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    stmt = select(models.Task).where(models.Task.owner_id == user.id)
    if status_filter:
        stmt = stmt.where(models.Task.status == status_filter)
    if priority:
        stmt = stmt.where(models.Task.priority == priority)
    if project_id is not None:
        stmt = stmt.where(models.Task.project_id == project_id)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(models.Task.title.ilike(like), models.Task.description.ilike(like))
        )
    if overdue:
        stmt = stmt.where(
            models.Task.due_date.is_not(None),
            models.Task.due_date < date.today(),
            models.Task.status != "done",
        )
    tasks = list(db.scalars(stmt))
    tasks.sort(
        key=lambda t: (
            t.status == "done",
            PRIORITY_ORDER[t.priority],
            t.due_date or date.max,
            t.id,
        )
    )
    return tasks


@router.get("/stats", response_model=schemas.TaskStats)
def task_stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.execute(
        select(models.Task.status, func.count())
        .where(models.Task.owner_id == user.id)
        .group_by(models.Task.status)
    ).all()
    counts = {"todo": 0, "in_progress": 0, "done": 0}
    counts.update({status_: n for status_, n in rows})
    total = sum(counts.values())
    overdue = db.scalar(
        select(func.count())
        .select_from(models.Task)
        .where(
            models.Task.owner_id == user.id,
            models.Task.due_date.is_not(None),
            models.Task.due_date < date.today(),
            models.Task.status != "done",
        )
    )
    rate = round(counts["done"] / total * 100, 1) if total else 0.0
    return schemas.TaskStats(total=total, overdue=overdue or 0, completion_rate=rate, **counts)


@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _validate_project(db, payload.project_id, user)
    task = models.Task(**payload.model_dump(), owner_id=user.id)
    task.title = task.title.strip()
    db.add(task)
    db.commit()
    return task


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return _get_owned_task(db, task_id, user)


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    changes = payload.model_dump(exclude_unset=True)
    if "project_id" in changes:
        _validate_project(db, changes["project_id"], user)
    for field, value in changes.items():
        # title/status/priority are non-nullable; ignore explicit nulls for them.
        if value is None and field in {"title", "status", "priority", "description"}:
            continue
        setattr(task, field, value)
    db.commit()
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
