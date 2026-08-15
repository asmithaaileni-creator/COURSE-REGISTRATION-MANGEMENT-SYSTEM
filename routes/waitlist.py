from flask import Blueprint, request, jsonify, session
from db import get_db
from auth_middleware import require_auth

waitlist_bp = Blueprint("waitlist", __name__)

def fmt_course_for_waitlist(c, enrolled_count):
    return {
        "id": c["id"],
        "code": c["code"],
        "name": c["name"],
        "department": c["department"],
        "credits": c["credits"],
        "instructorName": c["instructor_name"],
        "maxSeats": c["max_seats"],
        "schedule": c["schedule"],
        "classroom": c["classroom"],
        "description": c["description"],
        "createdAt": c["created_at"].isoformat(),
        "enrolledCount": enrolled_count,
        "availableSeats": max(0, c["max_seats"] - enrolled_count),
        "prerequisites": [],
    }

@waitlist_bp.get("/api/waitlist")
@require_auth
def list_waitlist():
    student_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()
        if session.get("role") == "admin":
            cur.execute("SELECT * FROM waitlist ORDER BY joined_at")
        else:
            cur.execute(
                "SELECT * FROM waitlist WHERE student_id = %s ORDER BY joined_at",
                (student_id,),
            )
        entries = cur.fetchall()

        result = []
        for e in entries:
            cur.execute(
                """SELECT c.*,
                          CAST(COUNT(en.id) FILTER (WHERE en.status='active') AS INT) as enrolled_count
                   FROM courses c
                   LEFT JOIN enrollments en ON en.course_id = c.id
                   WHERE c.id = %s GROUP BY c.id""",
                (e["course_id"],),
            )
            course = cur.fetchone()
            result.append({
                "id": e["id"],
                "studentId": e["student_id"],
                "courseId": e["course_id"],
                "position": e["position"],
                "joinedAt": e["joined_at"].isoformat(),
                "course": fmt_course_for_waitlist(course, course["enrolled_count"]) if course else None,
            })

        return jsonify(result)
    finally:
        conn.close()

@waitlist_bp.post("/api/waitlist/<int:course_id>")
@require_auth
def join_waitlist(course_id):
    student_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id FROM waitlist WHERE student_id = %s AND course_id = %s",
            (student_id, course_id),
        )
        if cur.fetchone():
            return jsonify({"error": "Already on waitlist for this course"}), 400

        cur.execute(
            "SELECT CAST(COUNT(*) AS INT) as cnt FROM waitlist WHERE course_id = %s",
            (course_id,),
        )
        position = cur.fetchone()["cnt"] + 1

        cur.execute(
            "INSERT INTO waitlist (student_id, course_id, position) VALUES (%s,%s,%s) RETURNING *",
            (student_id, course_id, position),
        )
        entry = cur.fetchone()
        conn.commit()
        return jsonify({
            "id": entry["id"],
            "studentId": entry["student_id"],
            "courseId": entry["course_id"],
            "position": entry["position"],
            "joinedAt": entry["joined_at"].isoformat(),
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@waitlist_bp.delete("/api/waitlist/<int:entry_id>/leave")
@require_auth
def leave_waitlist(entry_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM waitlist WHERE id = %s", (entry_id,))
        entry = cur.fetchone()
        if not entry:
            return jsonify({"error": "Waitlist entry not found"}), 404

        if session.get("role") != "admin" and entry["student_id"] != session["user_id"]:
            return jsonify({"error": "Forbidden"}), 403

        cur.execute("DELETE FROM waitlist WHERE id = %s", (entry_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Left waitlist"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
