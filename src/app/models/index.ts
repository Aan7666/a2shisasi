// ── Shared base types ─────────────────────────────────────────────────────────

export interface Instructor {
  id: number;
  name: string;
  avatar?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  courses_count?: number;
}

// ── Course & Lesson ───────────────────────────────────────────────────────────

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  status: 'draft' | 'unpublished' | 'published' | 'archived';
  instructor_id: number;
  category_id?: number;
  lessons?: Lesson[];
  enrollments_count?: number;
  instructor?: Instructor;
  category?: Category;
  has_access?: boolean;
  rating?: number;
  total_students?: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  type: 'video' | 'text' | 'document';
  description: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  duration_or_pages?: string;
  order: number;
  status: 'draft' | 'published';
  is_completed?: boolean;
  next_lesson_id?: number;
  prev_lesson_id?: number;
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export interface Quiz {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  time_limit?: number;
  max_attempts?: number;
  totalQuestions?: number;
  isAttempted?: boolean;
  score?: number;
  isPassed?: boolean;
  can_attempt?: any;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: string;
  order: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  text: string;
}

export interface QuizAnswer {
  questionId: number;
  optionId: number;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export interface Progress {
  id: number;
  student_id: number;
  course_id: number;
  lesson_id: number;
  is_completed: boolean;
  completed_at: string;
}

export interface LessonProgress {
  id: number;
  title: string;
  type: string;
  order: number;
  isCompleted: boolean;
}

export interface ProgressSummary {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lessons?: LessonProgress[];
  status?: 'completed' | 'in_progress';
  course?: Course;
}

// ── Certificate ───────────────────────────────────────────────────────────────

export interface Certificate {
  id: number;
  course: Course;
  studentName?: string;
  courseName?: string;
  instructorName?: string;
  score: number;
  issuedAt: string;
  certificateUrl: string;
}

// ── API wrapper ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface InstructorDashboard {
  totalCourses: number;
  totalStudents: number;
  totalPublished: number;
}
