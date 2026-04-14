from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, text
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas.analytics import (
    AnalyticsSummary, DepartmentStat, CategoryStat, MonthlyTrend, 
    HeatmapPoint, CampusPulseResponse, CategoryETAResponse, UserImpactResponse
)
from app.auth.jwt import require_role, get_any_authenticated
from app.services.nlp_engine import suggest_category

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.faculty)),
):
    # Determine department scope
    base_query = db.query(Complaint)
    if current_user.role == UserRole.faculty:
        base_query = base_query.filter(Complaint.assigned_department_id == current_user.department_id)

    total = base_query.count()
    resolved = base_query.filter(Complaint.status == ComplaintStatus.resolved).count()
    pending = base_query.filter(Complaint.status == ComplaintStatus.submitted).count()
    in_progress = base_query.filter(Complaint.status == ComplaintStatus.in_progress).count()
    rate = round((resolved / total * 100) if total > 0 else 0.0, 2)

    # Department stats
    dept_stats = []
    # If admin, show all departments. If faculty, only show their own.
    dept_query = db.query(Department)
    if current_user.role == UserRole.faculty:
        dept_query = dept_query.filter(Department.id == current_user.department_id)
        
    departments = dept_query.all()
    for dept in departments:
        dept_total = db.query(func.count(Complaint.id)).filter(
            Complaint.assigned_department_id == dept.id
        ).scalar()
        dept_resolved = db.query(func.count(Complaint.id)).filter(
            Complaint.assigned_department_id == dept.id,
            Complaint.status == ComplaintStatus.resolved
        ).scalar()
        if dept_total > 0:
            dept_stats.append(DepartmentStat(
                department_name=dept.name,
                total=dept_total,
                resolved=dept_resolved,
                pending=dept_total - dept_resolved,
            ))

    # Category distribution
    cat_query = db.query(Complaint.category, func.count(Complaint.id))
    if current_user.role == UserRole.faculty:
        cat_query = cat_query.filter(Complaint.assigned_department_id == current_user.department_id)
    cat_rows = cat_query.group_by(Complaint.category).all()
    category_dist = [CategoryStat(category=row[0].value, count=row[1]) for row in cat_rows]

    # Monthly trends (last 6 months)
    monthly_trends = []
    for i in range(5, -1, -1):
        target = datetime.utcnow() - timedelta(days=i * 30)
        month_label = target.strftime("%b %Y")
        
        trend_query = db.query(func.count(Complaint.id)).filter(
            extract("month", Complaint.created_at) == target.month,
            extract("year", Complaint.created_at) == target.year,
        )
        if current_user.role == UserRole.faculty:
            trend_query = trend_query.filter(Complaint.assigned_department_id == current_user.department_id)
            
        month_total = trend_query.scalar()
        
        resolved_trend_query = db.query(func.count(Complaint.id)).filter(
            extract("month", Complaint.created_at) == target.month,
            extract("year", Complaint.created_at) == target.year,
            Complaint.status == ComplaintStatus.resolved,
        )
        if current_user.role == UserRole.faculty:
            resolved_trend_query = resolved_trend_query.filter(Complaint.assigned_department_id == current_user.department_id)
            
        month_resolved = resolved_trend_query.scalar()
        monthly_trends.append(MonthlyTrend(month=month_label, total=month_total, resolved=month_resolved))

    return AnalyticsSummary(
        total_complaints=total,
        resolved_complaints=resolved,
        pending_complaints=pending,
        in_progress_complaints=in_progress,
        resolution_rate=rate,
        department_stats=dept_stats,
        category_distribution=category_dist,
        monthly_trends=monthly_trends,
    )


@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.faculty)),
):
    """Returns complaint density by location for the campus heatmap."""
    rows = (
        db.query(
            Complaint.location,
            Complaint.location_x,
            Complaint.location_y,
            func.count(Complaint.id).label("count"),
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


@router.get("/departments")
def get_department_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.faculty)),
):
    departments = db.query(Department).all()
    result = []
    for dept in departments:
        total = db.query(func.count(Complaint.id)).filter(Complaint.assigned_department_id == dept.id).scalar()
        resolved = db.query(func.count(Complaint.id)).filter(
            Complaint.assigned_department_id == dept.id,
            Complaint.status == ComplaintStatus.resolved
        ).scalar()
        result.append({
            "department": dept.name,
            "total": total,
            "resolved": resolved,
            "pending": total - resolved,
            "resolution_rate": round((resolved / total * 100) if total > 0 else 0, 2),
        })
    return result


@router.get("/campus-pulse", response_model=CampusPulseResponse)
def get_campus_pulse(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    """Student-specific summary of campus performance (last 30 days)."""
    last_30_days = datetime.utcnow() - timedelta(days=30)
    
    total = db.query(func.count(Complaint.id)).filter(Complaint.created_at >= last_30_days).scalar()
    resolved = db.query(func.count(Complaint.id)).filter(
        Complaint.created_at >= last_30_days,
        Complaint.status == ComplaintStatus.resolved
    ).scalar()
    
    # Calculate Avg Resolution Time (Hours)
    resolved_list = db.query(Complaint).filter(
        Complaint.status == ComplaintStatus.resolved,
        Complaint.resolved_at >= last_30_days
    ).all()
    
    # Fallback to last 50 resolved items if last 30 days are quiet
    if len(resolved_list) < 5:
        resolved_list = db.query(Complaint).filter(
            Complaint.status == ComplaintStatus.resolved,
            Complaint.resolved_at.isnot(None)
        ).order_by(Complaint.resolved_at.desc()).limit(50).all()

    avg_hours = 0
    if resolved_list:
        total_seconds = sum([(c.resolved_at - c.created_at).total_seconds() for c in resolved_list if c.resolved_at])
        avg_hours = round(total_seconds / (3600 * len(resolved_list)), 1)
    
    # System Reliability Index (SRI) - Data Science approach to system health
    # Ratio of resolved vs total reports (last 30 days) normalized to 0-10
    total_30_days = total if total > 0 else 1
    sri_score = round((resolved / total_30_days) * 10, 1) # Return 0.0 if no data
    
    # Standard labels for Data Science status monitoring
    label = "System Ready"
    if total == 0: label = "Waiting for Data"
    elif sri_score >= 9.0: label = "High Stability"
    elif sri_score >= 7.5: label = "Optimal Efficiency" 
    elif sri_score < 4.0: label = "Critical System Strain"
    elif sri_score < 6.0: label = "Review Required"

    return CampusPulseResponse(
        resolution_rate=round((resolved / total * 100) if total > 0 else 0, 2),
        avg_resolution_time_hours=avg_hours,
        total_resolved_30_days=resolved,
        system_reliability_score=sri_score,
        system_reliability_label=label,
        top_department=None # Removed as per user request for student view
    )


@router.get("/user-impact", response_model=UserImpactResponse)
def get_user_impact(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    """Calculate the individual student's impact on campus."""
    from app.models.complaint import ComplaintUpvote
    
    total_reported = db.query(func.count(Complaint.id)).filter(Complaint.student_id == current_user.id).scalar()
    total_resolved = db.query(func.count(Complaint.id)).filter(
        Complaint.student_id == current_user.id,
        Complaint.status == ComplaintStatus.resolved
    ).scalar()
    
    # Sum of all upvotes received on their complaints
    total_upvotes = db.query(func.count(ComplaintUpvote.id)).join(Complaint).filter(
        Complaint.student_id == current_user.id
    ).scalar()
    
    # Data Science Weighting Formula: (Upvotes * 2) + (Resolved * 5)
    impact_score = (total_upvotes * 2) + (total_resolved * 5)
    
    # Dynamic labels (Strictly professional, no emojis)
    label = "Campus Observer"
    if impact_score > 50: label = "System Catalyst"
    elif impact_score > 20: label = "Senior Advocate"
    elif impact_score > 5: label = "Active Contributor"
    
    return UserImpactResponse(
        total_reported=total_reported,
        total_resolved=total_resolved,
        total_upvotes=total_upvotes,
        impact_score=impact_score,
        impact_label=label
    )


@router.post("/suggest-category")
def post_suggest_category(
    body: dict,
    current_user: User = Depends(get_any_authenticated),
):
    """Takes a title and description and returns a suggested category."""
    title = body.get("title", "")
    desc = body.get("description", "")
    full_text = f"{title}. {desc}"
    
    suggestion = suggest_category(full_text)
    
    return {
        "suggested_category": suggestion.value if suggestion else None,
        "confidence": 0.85 if suggestion else 0.0
    }


# Industry-standard baselines for initial Data Science estimation (fallback when no real data exists)
BASE_CATEGORY_ETA = {
    ComplaintCategory.plumbing: 6.5,
    ComplaintCategory.electrical: 4.2,
    ComplaintCategory.it_services: 2.1,
    ComplaintCategory.cleanliness: 1.5,
    ComplaintCategory.infrastructure: 12.0,
    ComplaintCategory.academic: 48.0,
    ComplaintCategory.canteen: 1.2,
    ComplaintCategory.security: 0.8,
    ComplaintCategory.transportation: 3.5,
    ComplaintCategory.other: 5.0
}


@router.get("/prediction/{category}", response_model=CategoryETAResponse)
def get_category_prediction(
    category: ComplaintCategory,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_any_authenticated),
):
    """Predictive ETA for an issue based on its category."""
    resolved_list = db.query(Complaint).filter(
        Complaint.category == category,
        Complaint.status == ComplaintStatus.resolved,
        Complaint.resolved_at.isnot(None)
    ).order_by(Complaint.resolved_at.desc()).limit(10).all()
    
    # Use real data if available, otherwise return 0.0 for a fresh start
    if resolved_list:
        total_seconds = sum([(c.resolved_at - c.created_at).total_seconds() for c in resolved_list])
        avg_hours = round(total_seconds / (3600 * len(resolved_list)), 1)
    else:
        avg_hours = 0.0
        
    return CategoryETAResponse(
        category=category.value,
        avg_hours=avg_hours,
        total_resolved=len(resolved_list)
    )
