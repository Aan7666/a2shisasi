export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

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

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  type: string;
  description?: string;
  duration?: string;
  duration_or_pages?: string;
  order: number;
  is_completed?: boolean;
}

export interface LessonDetail {
  id: number;
  title: string;
  type: string;
  description?: string;
  content?: string;       // for type='text'
  file_url?: string;      // video URL (Cloudinary) or PDF URL
  file_name?: string;
  duration_or_pages?: string;
  order: number;
  is_completed: boolean;
  next_lesson_id?: number;
  prev_lesson_id?: number;
}

export interface Enrollment {
  id?: number;
  student_id: number;
  course_id: number;
  status: string;
  enrolled_at?: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  price: number;
  thumbnail?: string;
  image?: string;
  cover_image?: string;
  cover?: string;
  image_path?: string;
  thumbnail_path?: string;
  image_url?: string;
  rating?: number;
  total_students?: number;
  lessons_count?: number;
  created_at?: string;
  status: string;
  instructor?: Instructor;
  category?: Category;
  lessons?: Lesson[];
  has_access?: boolean;
}

export interface CourseDetail extends Course {
  instructor?: Instructor;
  category?: Category;
  lessons?: Lesson[];
  has_access?: boolean;
}

export interface CategorySection {
  category_id: number;
  category_name: string;
  category_slug: string;
  courses: Course[];
}

export interface HomeData {
  trending: Course[];
  category_sections: CategorySection[];
  newest: Course[];
}
