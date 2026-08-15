from flask import Blueprint, request, jsonify, session
from db import get_db
from auth_middleware import require_auth, require_admin

students_bp = Blueprint("students", __name__)

def fmt_student(s, enrollment_count=0):
    return {
        "id": s["id"],
        "username": s["username"],
        "email": s["email"],
        "firstName": s["first_name"],
        "lastName": s["last_name"],
        "role": s["role"],
        "createdAt": s["created_at"].isoformat(),
        "enrollmentCount": enrollment_count,
    }

def get_enrollment_count(cur, student_id):
    cur.execute(
        "SELECT CAST(COUNT(*) AS INT) as cnt FROM enrollments WHERE student_id = %s AND status = 'active'",
        (student_id,),
    )
    return cur.fetchone()["cnt"]

@students_bp.get("/api/students")
@require_admin
def list_students():
    search = request.args.get("search", "").strip()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    offset = (page - 1) * limit

    conn = get_db()
    try:
        cur = conn.cursor()
        if search:
            pattern = f"%{search}%"
            cur.execute(
                """SELECT u.*, CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrollment_count
                   FROM users u LEFT JOIN enrollments e ON e.student_id = u.id
                   WHERE u.role = 'student'
                   AND (u.username ILIKE %s OR u.email ILIKE %s OR u.first_name ILIKE %s OR u.last_name ILIKE %s)
                   GROUP BY u.id ORDER BY u.created_at
                   LIMIT %s OFFSET %s""",
                (pattern, pattern, pattern, pattern, limit, offset),
            )
        else:
            cur.execute(
                """SELECT u.*, CAST(COUNT(e.id) FILTER (WHERE e.status='active') AS INT) as enrollment_count
                   FROM users u LEFT JOIN enrollments e ON e.student_id = u.id
                   WHERE u.role = 'student'
                   GROUP BY u.id ORDER BY u.created_at
                   LIMIT %s OFFSET %s""",
                (limit, offset),
            )
        rows = cur.fetchall()

        cur.execute("SELECT CAST(COUNT(*) AS INT) as total FROM users WHERE role = 'student'")
        total = cur.fetchone()["total"]

        students = [fmt_student(r, r["enrollment_count"]) for r in rows]
        return jsonify({"students": students, "total": total, "page": page, "limit": limit})
    finally:
        conn.close()

@students_bp.get("/api/students/<int:student_id>")
@require_auth
def get_student(student_id):
    if session.get("role") != "admin" and session.get("user_id") != student_id:
        return jsonify({"error": "Forbidden"}), 403

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (student_id,))
        student = cur.fetchone()
        if not student:
            return jsonify({"error": "Student not found"}), 404
        count = get_enrollment_count(cur, student_id)
        return jsonify(fmt_student(student, count))
    finally:
        conn.close()

@students_bp.patch("/api/students/<int:student_id>")
@require_auth
def update_student(student_id):
    if session.get("role") != "admin" and session.get("user_id") != student_id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    fields_map = {
        "firstName": "first_name",
        "lastName": "last_name",
        "email": "email",
        "username": "username",
    }
    updates = []
    vals = []
    for key, col in fields_map.items():
        if key in data:
            updates.append(f"{col} = %s")
            vals.append(data[key])

    conn = get_db()
    try:
        cur = conn.cursor()
        if updates:
            cur.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING *",
                vals + [student_id],
            )
            student = cur.fetchone()
            if not student:
                return jsonify({"error": "Student not found"}), 404
        else:
            cur.execute("SELECT * FROM users WHERE id = %s", (student_id,))
            student = cur.fetchone()
            if not student:
                return jsonify({"error": "Student not found"}), 404

        conn.commit()
        count = get_enrollment_count(cur, student_id)
        return jsonify(fmt_student(student, count))
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@students_bp.delete("/api/students/<int:student_id>")
@require_admin
def delete_student(student_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s RETURNING id", (student_id,))
        if not cur.fetchone():
            return jsonify({"error": "Student not found"}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Student deleted"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
