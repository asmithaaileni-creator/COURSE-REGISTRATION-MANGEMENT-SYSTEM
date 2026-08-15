from flask import Blueprint, jsonify
from db import get_db
from auth_middleware import require_auth
from datetime import datetime, timedelta

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/api/dashboard/stats")
@require_auth
def stats():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT CAST(COUNT(*) AS INT) as total FROM users WHERE role = 'student'")
        total_students = cur.fetchone()["total"]

        cur.execute("SELECT CAST(COUNT(*) AS INT) as total FROM courses")
        total_courses = cur.fetchone()["total"]

        cur.execute("SELECT CAST(COUNT(*) AS INT) as total FROM enrollments WHERE status = 'active'")
        total_enrollments = cur.fetchone()["total"]

        cur.execute(
            """SELECT c.id, c.name, c.max_seats,
                      CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrolled_count
               FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
               GROUP BY c.id"""
        )
        courses = cur.fetchall()
        total_available_seats = sum(max(0, c["max_seats"] - c["enrolled_count"]) for c in courses)
        most_popular = max(courses, key=lambda c: c["enrolled_count"], default=None)

        one_week_ago = datetime.utcnow() - timedelta(days=7)
        cur.execute(
            "SELECT CAST(COUNT(*) AS INT) as total FROM enrollments WHERE status = 'active' AND enrolled_at >= %s",
            (one_week_ago,),
        )
        recent_enrollments = cur.fetchone()["total"]

        return jsonify({
            "totalStudents": total_students,
            "totalCourses": total_courses,
            "totalEnrollments": total_enrollments,
            "totalAvailableSeats": total_available_seats,
            "mostPopularCourse": most_popular["name"] if most_popular else None,
            "recentEnrollments": recent_enrollments,
        })
    finally:
        conn.close()

@dashboard_bp.get("/api/dashboard/popular-courses")
@require_auth
def popular_courses():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT c.id, c.name, c.code, c.department, c.max_seats,
                      CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrolled_count
               FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
               GROUP BY c.id
               ORDER BY enrolled_count DESC
               LIMIT 10"""
        )
        rows = cur.fetchall()
        return jsonify([
            {
                "id": r["id"],
                "name": r["name"],
                "code": r["code"],
                "department": r["department"],
                "maxSeats": r["max_seats"],
                "enrolledCount": r["enrolled_count"],
            }
            for r in rows
        ])
    finally:
        conn.close()

@dashboard_bp.get("/api/dashboard/departments")
@require_auth
def departments():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT c.department,
                      CAST(COUNT(DISTINCT c.id) AS INT) as course_count,
                      CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrollment_count
               FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
               GROUP BY c.department
               ORDER BY c.department"""
        )
        rows = cur.fetchall()
        return jsonify([
            {
                "department": r["department"],
                "courseCount": r["course_count"],
                "enrollmentCount": r["enrollment_count"],
            }
            for r in rows
        ])
    finally:
        conn.close()
