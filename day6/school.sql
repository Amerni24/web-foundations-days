PRAGMA foreign_keys = ON;

-- Reset (lets you run this file again without errors)
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ============ TABLES ============

CREATE TABLE students (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id      INTEGER PRIMARY KEY,
  title   TEXT NOT NULL,
  code    TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
  student_id  INTEGER NOT NULL,
  course_id   INTEGER NOT NULL,
  grade       TEXT,
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id),  -- same student cannot enrol on the same course twice
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);

-- ============ SAMPLE DATA ============

INSERT INTO students (name, email) VALUES
  ('Amina Otieno', 'amina@example.com'),
  ('Brian Kamau',  'brian@example.com'),
  ('Cynthia Mwangi', 'cynthia@example.com'),
  ('David Katana', 'david@example.com');

INSERT INTO courses (title, code) VALUES
  ('Web Development', 'CS101'),
  ('Databases',       'CS102'),
  ('Mathematics',     'MT101');

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),
  (1, 2, 'B'),
  (2, 1, 'B'),
  (2, 3, 'C'),
  (3, 1, 'A'),
  (3, 2, NULL);

-- ============ QUERIES ============

-- 1. All courses for one student (by name)
SELECT courses.title, courses.code, enrolments.grade
FROM enrolments
JOIN students ON enrolments.student_id = students.id
JOIN courses  ON enrolments.course_id  = courses.id
WHERE students.name = 'Amina Otieno';

-- 2. All students on one course
SELECT students.name, students.email, enrolments.grade
FROM enrolments
JOIN students ON enrolments.student_id = students.id
JOIN courses  ON enrolments.course_id  = courses.id
WHERE courses.title = 'Web Development';

-- 3. Number of students per course
SELECT courses.title, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON enrolments.course_id = courses.id
GROUP BY courses.id;

-- 4. Students who have no enrolments
SELECT students.name, students.email
FROM students
LEFT JOIN enrolments ON enrolments.student_id = students.id
WHERE enrolments.student_id IS NULL;

-- 5. Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE student_id = 3 AND course_id = 2;

-- Check the update
SELECT * FROM enrolments WHERE student_id = 3 AND course_id = 2;