from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["todo", "in_progress", "done"]
Priority = Literal["low", "medium", "high"]

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UserCreate(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255)
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str = Field(default="#4f46e5", pattern=r"^#[0-9a-fA-F]{6}$")


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    status: Status = "todo"
    priority: Priority = "medium"
    due_date: date | None = None
    project_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: Status | None = None
    priority: Priority | None = None
    due_date: date | None = None
    project_id: int | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: Status
    priority: Priority
    due_date: date | None
    project_id: int | None
    created_at: datetime
    updated_at: datetime


class TaskStats(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
    overdue: int
    completion_rate: float
