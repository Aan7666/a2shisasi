import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Instructor {
  id: number;
  name: string;
  avatar?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  type: string;           // 'video' | 'text' | 'document'
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

export interface Course {
  id: number;
  title: string;
  instructor?: Instructor;
  category?: Category;
  price: number;
  rating?: number;
  total_students?: number;
  lessons_count?: number;
  has_access?: boolean;
  status: string;
  thumbnail?: string;
  image?: string;
  cover_image?: string;
  cover?: string;
  image_path?: string;
  thumbnail_path?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
  lessons?: Lesson[];
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

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // GET /api/home
  getHomeData(limit: number = 8): Observable<HomeData> {
    return this.http.get<any>(`${this.apiUrl}/home?limit=${limit}`).pipe(
      map(response => {
        const data = response?.data || response;
        return {
          trending: data?.trending || [],
          category_sections: data?.category_sections || [],
          newest: data?.newest || [],
        } as HomeData;
      })
    );
  }

  // GET /api/categories
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/categories`).pipe(
      map(response => {
        if (response?.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      })
    );
  }

  // GET /api/courses
  getCourses(): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}/courses`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        if (response && response.data) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      })
    );
  }

  // GET /api/courses/{id}
  getCourseDetail(id: number): Observable<Course | null> {
    return this.http.get<any>(`${this.apiUrl}/courses/${id}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data;
        }
        if (response && response.data) {
          return response.data;
        }
        return response || null;
      })
    );
  }

  // GET /api/courses/{id}/check-access
  checkAccess(id: number): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/courses/${id}/check-access`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return response.data.hasAccess;
        }
        if (response && response.data) {
          return response.data.hasAccess;
        }
        return false;
      })
    );
  }

  // ── LESSON ENDPOINTS ──────────────────────────────────────

  // GET /api/student/courses/{courseId}/lessons
  getLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<any>(`${this.apiUrl}/student/courses/${courseId}/lessons`).pipe(
      map(response => {
        if (response?.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      })
    );
  }

  // GET /api/student/courses/{courseId}/lessons/{lessonId}
  getLessonDetail(courseId: number, lessonId: number): Observable<LessonDetail> {
    return this.http.get<any>(`${this.apiUrl}/student/courses/${courseId}/lessons/${lessonId}`).pipe(
      map(response => response?.data || response)
    );
  }

  // POST /api/student/courses/{courseId}/lessons/{lessonId}/complete
  markComplete(courseId: number, lessonId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/student/courses/${courseId}/lessons/${lessonId}/complete`, {}
    );
  }
}

