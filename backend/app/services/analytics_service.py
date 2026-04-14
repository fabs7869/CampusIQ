"""
AnalyticsService — query helpers for dashboard and heatmap data.
"""
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.complaint import Complaint, ComplaintStatus
from app.models.department import Department
from app.schemas.analytics import (
    AnalyticsSummary, DepartmentStat, CategoryStat, MonthlyTrend, HeatmapPoint
)


class AnalyticsService:

    @staticmethod
    def get_summary(db: Session) -> AnalyticsSummary:
        total = db.query(func.count(Complaint.id)).scalar() or 0
        resolved = db.query(func.count(Complaint.id)).filter(
            Complaint.status == ComplaintStatus.resolved
        ).scalar() or 0
        pending = db.query(func.count(Complaint.id)).filter(
            Complaint.status == ComplaintStatus.submitted
        ).scalar() or 0
        in_progress = db.query(func.count(Complaint.id)).filter(
            Complaint.status == ComplaintStatus.in_progress
        ).scalar() or 0

        resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0.0

        # Department stats
        dept_rows = (
            db.query(
                Department.name.label("department_name"),
                func.count(Complaint.id).label("total"),
                func.sum(
                    func.cast(Complaint.status == ComplaintStatus.resolved, db.bind.dialect.name == "postgresql" and "int" or "integer")
                ).label("resolved"),
            )
            .outerjoin(Complaint, Complaint.assigned_department_id == Department.id)
            .group_by(Department.id, Department.name)
            .all()
        )
        department_stats = [
            DepartmentStat(
                department_name=r.department_name,
                total=r.total or 0,
                resolved=r.resolved or 0,
                pending=(r.total or 0) - (r.resolved or 0),
            )
            for r in dept_rows
        ]

        # Category distribution
        cat_rows = (
            db.query(Complaint.category, func.count(Complaint.id).label("count"))
            .group_by(Complaint.category)
            .all()
        )
        category_distribution = [
            CategoryStat(category=str(r.category.value), count=r.count)
            for r in cat_rows
        ]

        # Monthly trends (last 6 months)
        monthly_rows = (
            db.query(
                func.to_char(Complaint.created_at, "Mon YYYY").label("month"),
                func.count(Complaint.id).label("total"),
                func.sum(
                    func.case((Complaint.status == ComplaintStatus.resolved, 1), else_=0)
                ).label("resolved"),
            )
            .group_by(func.to_char(Complaint.created_at, "Mon YYYY"))
            .order_by(func.min(Complaint.created_at))
            .limit(6)
            .all()
        )
        monthly_trends = [
            MonthlyTrend(month=r.month, total=r.total or 0, resolved=int(r.resolved or 0))
            for r in monthly_rows
        ]

        return AnalyticsSummary(
            total_complaints=total,
            resolved_complaints=resolved,
            pending_complaints=pending,
            in_progress_complaints=in_progress,
            resolution_rate=resolution_rate,
            department_stats=department_stats,
            category_distribution=category_distribution,
            monthly_trends=monthly_trends,
        )

    @staticmethod
    def get_heatmap(db: Session) -> List[HeatmapPoint]:
        rows = (
            db.query(
                Complaint.location,
                Complaint.location_x,
                Complaint.location_y,
                func.count(Complaint.id).label("count"),
            )
            .filter(
                Complaint.location_x.isnot(None),
                Complaint.location_y.isnot(None),
            )
            .group_by(Complaint.location, Complaint.location_x, Complaint.location_y)
            .all()
        )

        if not rows:
            return []

        max_count = max(r.count for r in rows)
        return [
            HeatmapPoint(
                location=r.location,
                location_x=r.location_x,
                location_y=r.location_y,
                count=r.count,
                intensity=round(r.count / max_count, 2),
            )
            for r in rows
        ]
