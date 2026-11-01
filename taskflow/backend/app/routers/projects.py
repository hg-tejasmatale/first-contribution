from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _get_owned_project(db: Session, project_id: int, user: models.User) -> models.Project:
    project = db.get(models.Project, project_id)
    if project is None or project.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    stmt = select(models.Project).where(models.Project.owner_id == user.id).order_by(models.Project.name)
    return list(db.scalars(stmt))


@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = models.Project(name=payload.name.strip(), color=payload.color, owner_id=user.id)
    db.add(project)
    db.commit()
    return project


@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(project, field, value)
    db.commit()
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, user)
    # Tasks survive project deletion; they just become unassigned.
    for task in project.tasks:
        task.project_id = None
    db.delete(project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
