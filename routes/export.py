import csv
import io
from flask import Blueprint, Response
from db import get_db
from auth_middleware import require_admin

export_bp = Blueprint("export", __name__)

def make_csv(headers, rows):
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()

@export_bp.get("/api/export/students")
@require_admin
def export_students():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
                      CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrollment_count
               FROM users u LEFT JOIN enrollments e ON e.student_id = u.id
               WHERE u.role = 'student'
               GROUP BY u.id"""
        )
        rows = cur.fetchall()
        csv_data = make_csv(
            ["ID", "Username", "Email", "First Name", "Last Name", "Active Enrollments", "Joined"],
            [
                [str(r["id"]), r["username"], r["email"], r["first_name"], r["last_name"],
                 str(r["enrollment_count"]), r["created_at"].isoformat()]
                for r in rows
            ],
        )
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=students.csv"},
        )
    finally:
        conn.close()

@export_bp.get("/api/export/courses")
@require_admin
def export_courses():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT c.id, c.code, c.name, c.department, c.credits, c.instructor_name,
                      c.max_seats, c.schedule, c.classroom, c.created_at,
                      CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrolled_count
               FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
               GROUP BY c.id"""
        )
        rows = cur.fetchall()
        csv_data = make_csv(
            ["ID", "Code", "Name", "Department", "Credits", "Instructor", "Max Seats", "Enrolled", "Available", "Schedule", "Classroom"],
            [
                [str(r["id"]), r["code"], r["name"], r["department"], str(r["credits"]),
                 r["instructor_name"], str(r["max_seats"]), str(r["enrolled_count"]),
                 str(max(0, r["max_seats"] - r["enrolled_count"])),
                 r["schedule"] or "", r["classroom"] or ""]
                for r in rows
            ],
        )
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=courses.csv"},
        )
    finally:
        conn.close()

@export_bp.get("/api/export/enrollments")
@require_admin
def export_enrollments():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT e.id, u.first_name || ' ' || u.last_name as student_name, u.email,
                      c.code, c.name as course_name, c.department, e.status, e.enrolled_at
               FROM enrollments e
               JOIN users u ON u.id = e.student_id
               JOIN courses c ON c.id = e.course_id
               ORDER BY e.enrolled_at"""
        )
        rows = cur.fetchall()
        csv_data = make_csv(
            ["ID", "Student Name", "Student Email", "Course Code", "Course Name", "Department", "Status", "Enrolled At"],
            [
                [str(r["id"]), r["student_name"], r["email"], r["code"],
                 r["course_name"], r["department"], r["status"], r["enrolled_at"].isoformat()]
                for r in rows
            ],
        )
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=enrollments.csv"},
        )
    finally:
        conn.close()
