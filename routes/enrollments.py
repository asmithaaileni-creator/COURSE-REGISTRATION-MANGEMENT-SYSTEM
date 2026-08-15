from flask import Blueprint, request, jsonify, session
from db import get_db
from auth_middleware import require_auth

enrollments_bp = Blueprint("enrollments", __name__)

def fmt_enrollment(e):
    result = {
        "id": e["id"],
        "studentId": e["student_id"],
        "courseId": e["course_id"],
        "status": e["status"],
        "enrolledAt": e["enrolled_at"].isoformat(),
    }
    if "course" in e and e["course"]:
        c = e["course"]
        enrolled = c.get("enrolled_count", 0)
        result["course"] = {
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
            "enrolledCount": enrolled,
            "availableSeats": max(0, c["max_seats"] - enrolled),
            "prerequisites": [],
        }
    if "student" in e and e["student"]:
        s = e["student"]
        result["student"] = {
            "id": s["id"],
            "username": s["username"],
            "email": s["email"],
            "firstName": s["first_name"],
            "lastName": s["last_name"],
            "role": s["role"],
            "createdAt": s["created_at"].isoformat(),
            "enrollmentCount": 0,
        }
    return result

@enrollments_bp.get("/api/enrollments")
@require_auth
def list_enrollments():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    offset = (page - 1) * limit
    course_id = request.args.get("courseId")

    student_id = request.args.get("studentId")
    if session.get("role") != "admin":
        student_id = session["user_id"]

    conn = get_db()
    try:
        cur = conn.cursor()
        conditions = []
        params = []
        if student_id:
            conditions.append("e.student_id = %s")
            params.append(int(student_id))
        if course_id:
            conditions.append("e.course_id = %s")
            params.append(int(course_id))

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cur.execute(
            f"""SELECT e.id, e.student_id, e.course_id, e.status, e.enrolled_at
                FROM enrollments e {where}
                ORDER BY e.enrolled_at LIMIT %s OFFSET %s""",
            params + [limit, offset],
        )
        rows = cur.fetchall()

        cur.execute(
            f"SELECT CAST(COUNT(*) AS INT) as total FROM enrollments e {where}", params
        )
        total = cur.fetchone()["total"]

        enrollments = []
        for row in rows:
            cur.execute("SELECT * FROM users WHERE id = %s", (row["student_id"],))
            student = cur.fetchone()
            cur.execute(
                """SELECT c.*,
                          CAST(COUNT(en.id) FILTER (WHERE en.status = 'active') AS INT) as enrolled_count
                   FROM courses c
                   LEFT JOIN enrollments en ON en.course_id = c.id
                   WHERE c.id = %s GROUP BY c.id""",
                (row["course_id"],),
            )
            course = cur.fetchone()
            enrollments.append(fmt_enrollment({**row, "student": student, "course": course}))

        return jsonify({"enrollments": enrollments, "total": total, "page": page, "limit": limit})
    finally:
        conn.close()

@enrollments_bp.post("/api/enrollments")
@require_auth
def create_enrollment():
    data = request.get_json() or {}
    course_id = data.get("courseId")
    if not course_id:
        return jsonify({"error": "courseId is required"}), 400

    student_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()

        cur.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
        course = cur.fetchone()
        if not course:
            return jsonify({"error": "Course not found"}), 404

        cur.execute(
            "SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s AND status = 'active'",
            (student_id, course_id),
        )
        if cur.fetchone():
            return jsonify({"error": "Already enrolled in this course"}), 400

        cur.execute("SELECT required_course_id FROM prerequisites WHERE course_id = %s", (course_id,))
        prereqs = cur.fetchall()
        for p in prereqs:
            cur.execute(
                "SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s",
                (student_id, p["required_course_id"]),
            )
            if not cur.fetchone():
                cur.execute("SELECT name FROM courses WHERE id = %s", (p["required_course_id"],))
                req_course = cur.fetchone()
                name = req_course["name"] if req_course else "Unknown"
                return jsonify({"error": f"Prerequisite not met: {name}"}), 400

        cur.execute(
            "SELECT CAST(COUNT(*) AS INT) as cnt FROM enrollments WHERE course_id = %s AND status = 'active'",
            (course_id,),
        )
        enrolled_count = cur.fetchone()["cnt"]
        if enrolled_count >= course["max_seats"]:
            return jsonify({"error": "Course is full. Consider joining the waitlist."}), 400

        cur.execute(
            "INSERT INTO enrollments (student_id, course_id, status) VALUES (%s,%s,'active') RETURNING *",
            (student_id, course_id),
        )
        enrollment = cur.fetchone()
        cur.execute(
            "INSERT INTO notifications (student_id, message, type) VALUES (%s,%s,'enrollment')",
            (student_id, f"You have successfully enrolled in {course['name']}"),
        )
        cur.execute(
            "INSERT INTO activity_logs (user_id, action, details) VALUES (%s,'ENROLL',%s)",
            (student_id, f"Enrolled in course: {course['name']} ({course['code']})"),
        )
        conn.commit()
        return jsonify(fmt_enrollment(enrollment)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@enrollments_bp.delete("/api/enrollments/<int:enrollment_id>")
@require_auth
def drop_enrollment(enrollment_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM enrollments WHERE id = %s", (enrollment_id,))
        enrollment = cur.fetchone()
        if not enrollment:
            return jsonify({"error": "Enrollment not found"}), 404

        if session.get("role") != "admin" and enrollment["student_id"] != session["user_id"]:
            return jsonify({"error": "Forbidden"}), 403

        cur.execute(
            "UPDATE enrollments SET status = 'dropped' WHERE id = %s", (enrollment_id,)
        )
        cur.execute("SELECT * FROM courses WHERE id = %s", (enrollment["course_id"],))
        course = cur.fetchone()
        course_name = course["name"] if course else "the course"

        cur.execute(
            "INSERT INTO notifications (student_id, message, type) VALUES (%s,%s,'dropped')",
            (enrollment["student_id"], f"You have dropped {course_name}"),
        )

        cur.execute(
            """SELECT * FROM waitlist WHERE course_id = %s ORDER BY position ASC LIMIT 1""",
            (enrollment["course_id"],),
        )
        next_waiting = cur.fetchone()
        if next_waiting:
            cur.execute(
                "INSERT INTO enrollments (student_id, course_id, status) VALUES (%s,%s,'active')",
                (next_waiting["student_id"], next_waiting["course_id"]),
            )
            cur.execute("DELETE FROM waitlist WHERE id = %s", (next_waiting["id"],))
            cur.execute(
                "INSERT INTO notifications (student_id, message, type) VALUES (%s,%s,'waitlist')",
                (
                    next_waiting["student_id"],
                    f"A seat opened up in {course_name}! You have been enrolled.",
                ),
            )

        conn.commit()
        return jsonify({"success": True, "message": "Enrollment dropped"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
