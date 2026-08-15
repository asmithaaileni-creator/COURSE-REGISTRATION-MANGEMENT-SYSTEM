from flask import Blueprint, request, jsonify, session
from db import get_db
from auth_middleware import require_auth, require_admin

courses_bp = Blueprint("courses", __name__)

def fmt_course(c, prereqs=None, enrolled_count=0):
    available = max(0, c["max_seats"] - enrolled_count)
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
        "availableSeats": available,
        "prerequisites": prereqs if prereqs is not None else [],
    }

def get_enrolled_count(cur, course_id):
    cur.execute(
        "SELECT COUNT(*) as cnt FROM enrollments WHERE course_id = %s AND status = 'active'",
        (course_id,),
    )
    return cur.fetchone()["cnt"]

def get_prereqs(cur, course_id):
    cur.execute(
        "SELECT required_course_id FROM prerequisites WHERE course_id = %s",
        (course_id,),
    )
    return [r["required_course_id"] for r in cur.fetchall()]

@courses_bp.get("/api/courses")
@require_auth
def list_courses():
    search = request.args.get("search", "").strip()
    department = request.args.get("department", "").strip()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    offset = (page - 1) * limit

    conn = get_db()
    try:
        cur = conn.cursor()
        conditions = []
        params = []
        if search:
            conditions.append(
                "(name ILIKE %s OR code ILIKE %s OR instructor_name ILIKE %s)"
            )
            params += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if department:
            conditions.append("department ILIKE %s")
            params.append(f"%{department}%")

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cur.execute(
            f"""
            SELECT c.*,
                   CAST(COUNT(e.id) FILTER (WHERE e.status = 'active') AS INT) as enrolled_count
            FROM courses c
            LEFT JOIN enrollments e ON e.course_id = c.id
            {where}
            GROUP BY c.id
            ORDER BY c.name
            LIMIT %s OFFSET %s
            """,
            params + [limit, offset],
        )
        rows = cur.fetchall()

        cur.execute(f"SELECT CAST(COUNT(*) AS INT) as total FROM courses {where}", params)
        total = cur.fetchone()["total"]

        cur.execute("SELECT course_id, required_course_id FROM prerequisites")
        all_prereqs = cur.fetchall()
        prereq_map = {}
        for p in all_prereqs:
            prereq_map.setdefault(p["course_id"], []).append(p["required_course_id"])

        courses = [fmt_course(r, prereq_map.get(r["id"], []), r["enrolled_count"]) for r in rows]
        return jsonify({"courses": courses, "total": total, "page": page, "limit": limit})
    finally:
        conn.close()

@courses_bp.get("/api/courses/<int:course_id>")
@require_auth
def get_course(course_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
        c = cur.fetchone()
        if not c:
            return jsonify({"error": "Course not found"}), 404
        enrolled = get_enrolled_count(cur, course_id)
        prereqs = get_prereqs(cur, course_id)
        return jsonify(fmt_course(c, prereqs, enrolled))
    finally:
        conn.close()

@courses_bp.post("/api/courses")
@require_admin
def create_course():
    data = request.get_json() or {}
    required = ["code", "name", "department", "credits", "instructorName", "maxSeats"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO courses (code, name, department, credits, instructor_name, max_seats, schedule, classroom, description)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (
                data["code"], data["name"], data["department"],
                data["credits"], data["instructorName"], data["maxSeats"],
                data.get("schedule"), data.get("classroom"), data.get("description"),
            ),
        )
        course = cur.fetchone()
        prereq_ids = data.get("prerequisiteIds", [])
        for rid in prereq_ids:
            cur.execute(
                "INSERT INTO prerequisites (course_id, required_course_id) VALUES (%s,%s)",
                (course["id"], rid),
            )
        conn.commit()
        prereqs = get_prereqs(cur, course["id"])
        return jsonify(fmt_course(course, prereqs, 0)), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@courses_bp.patch("/api/courses/<int:course_id>")
@require_admin
def update_course(course_id):
    data = request.get_json() or {}
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
        if not cur.fetchone():
            return jsonify({"error": "Course not found"}), 404

        fields_map = {
            "code": "code", "name": "name", "department": "department",
            "credits": "credits", "instructorName": "instructor_name",
            "maxSeats": "max_seats", "schedule": "schedule",
            "classroom": "classroom", "description": "description",
        }
        updates = []
        vals = []
        for key, col in fields_map.items():
            if key in data:
                updates.append(f"{col} = %s")
                vals.append(data[key])

        if updates:
            cur.execute(
                f"UPDATE courses SET {', '.join(updates)} WHERE id = %s RETURNING *",
                vals + [course_id],
            )
            course = cur.fetchone()
        else:
            cur.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
            course = cur.fetchone()

        if "prerequisiteIds" in data:
            cur.execute("DELETE FROM prerequisites WHERE course_id = %s", (course_id,))
            for rid in data["prerequisiteIds"]:
                cur.execute(
                    "INSERT INTO prerequisites (course_id, required_course_id) VALUES (%s,%s)",
                    (course_id, rid),
                )

        conn.commit()
        enrolled = get_enrolled_count(cur, course_id)
        prereqs = get_prereqs(cur, course_id)
        return jsonify(fmt_course(course, prereqs, enrolled))
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@courses_bp.delete("/api/courses/<int:course_id>")
@require_admin
def delete_course(course_id):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM courses WHERE id = %s RETURNING id", (course_id,))
        if not cur.fetchone():
            return jsonify({"error": "Course not found"}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Course deleted"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
