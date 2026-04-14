from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class DepartmentStat(BaseModel):
    department_name: str
    total: int
    resolved: int
    pending: int


class CategoryStat(BaseModel):
    category: str
    count: int


class MonthlyTrend(BaseModel):
    month: str
    total: int
    resolved: int


class AnalyticsSummary(BaseModel):
    total_complaints: int
    resolved_complaints: int
    pending_complaints: int
    in_progress_complaints: int
    resolution_rate: float
    department_stats: List[DepartmentStat]
    category_distribution: List[CategoryStat]
    monthly_trends: List[MonthlyTrend]


class HeatmapPoint(BaseModel):
    location: str
    location_x: Optional[float] = None
    location_y: Optional[float] = None
    count: int
    intensity: float


class CampusPulseResponse(BaseModel):
    resolution_rate: float
    avg_resolution_time_hours: float
    total_resolved_30_days: int
    system_reliability_score: float # 0-10
    system_reliability_label: str # e.g. "High Stability"
    top_department: Optional[str] = None


class CategoryETAResponse(BaseModel):
    category: str
    avg_hours: float
    total_resolved: int


class UserImpactResponse(BaseModel):
    total_reported: int
    total_resolved: int
    total_upvotes: int
    impact_score: int
    impact_label: str # e.g. "Campus Catalyst"
