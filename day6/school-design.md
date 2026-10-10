# School Database Design

## Tables

### students
Stores one row per student.
- `id` (primary key), `name` (required), `email` (required, unique), `created_at` (filled in automatically).
- `email` is `UNIQUE` so two students cannot share an email address.

### courses
Stores one row per course.
- `id` (primary key), `title` (required), `code` (required, unique, e.g. CS101).

### enrolments
Stores one row for each time a student is enrolled on a course. It links the other two tables and holds the grade.
- `student_id` (foreign key to `students.id`), `course_id` (foreign key to `courses.id`), `grade` (optional until marked), `enrolled_at`.
- The primary key is the pair `(student_id, course_id)`. This stops the same student enrolling on the same course twice.
- Both foreign keys use `ON DELETE CASCADE`, so deleting a student or course also removes their enrolments.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to one course.
- **students to courses: many-to-many.** One student can take many courses, and one course has many students.

A join table is needed because a single column cannot hold many values. Storing a list such as `courses = "CS101,CS102"` in the students table would be hard to search and update. The `enrolments` table stores one pair of ids per row, and it is also the natural place for facts about the pair itself, such as the grade.

## Index

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

The primary key `(student_id, course_id)` already makes searching by student fast, but it does not help when searching by course alone. This index speeds up "all students on one course" and "number of students per course", which would otherwise scan every enrolment row as the school grows.

## SQL or NoSQL?

I would choose SQL (for example SQLite or PostgreSQL). The data is clearly structured, with students, courses and enrolments, and the relationships between them are central to the system. SQL handles these with foreign keys and JOINs, and the database itself enforces rules such as unique emails and no duplicate enrolments. Correctness matters for school records like grades, and SQL's transactions help guarantee it. A document database would be more attractive only if the data became very flexible or needed huge scale across many servers, which a school system does not.
