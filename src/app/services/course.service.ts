import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  Course,
  CourseDetail,
  Category,
  HomeData,
  CategorySection,
  Lesson,
  LessonDetail
} from './course.interfaces';

export * from './course.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * 1. GET /courses
   * Public, tanpa auth
   * Returns: Course[]
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/courses`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * 2. GET /courses/{id}
   * Public, JWT opsional. Jika user login, token disertakan oleh interceptor.
   * Returns: CourseDetail
   */
  getCourseDetail(id: number): Observable<CourseDetail> {
    const url = `${this.apiUrl}/courses/${id}`;
    console.log('[CourseService] Fetching course detail from:', url);

    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('[CourseService] Raw response:', response);
        // ApiResponse wrapper format: { success, message, data }
        if (response?.success && response?.data) return response.data as CourseDetail;
        if (response?.data) return response.data as CourseDetail;
        // Jika backend mengembalikan objek course langsung (tanpa wrapper)
        if (response?.id) return response as CourseDetail;
        throw new Error('Format response tidak dikenali dari server');
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('[CourseService] ❌ HTTP Error:', err.status, err.statusText);
        console.error('[CourseService] Error body:', err.error);
        return this.handleError(err);
      })
    );
  }

  /**
   * 3. GET /courses/trending
   * Public
   * Params: limit (default 10)
   * Returns: Course[]
   */
  getTrendingCourses(limit: number = 10): Observable<Course[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/courses/trending`, { params }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * 4. GET /courses/category/{slug}
   * Public
   * Params: sort, limit (default 10)
   * Returns: { category: Category, courses: Course[] }
   */
  getCoursesByCategory(slug: string, sort: string = 'rating', limit: number = 10): Observable<{ category: Category; courses: Course[] }> {
    let params = new HttpParams()
      .set('sort', sort)
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<{ category: Category; courses: Course[] }>>(
      `${this.apiUrl}/courses/category/${slug}`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * 5. GET /courses/search
   * Public
   * Params: q, category_id, sort, limit
   * Returns: Course[]
   */
  searchCourses(paramsInput: { q?: string; category_id?: number; sort?: string; limit?: number }): Observable<Course[]> {
    let params = new HttpParams();

    if (paramsInput.q) {
      params = params.set('q', paramsInput.q);
    }
    if (paramsInput.category_id !== undefined && paramsInput.category_id !== null) {
      params = params.set('category_id', paramsInput.category_id.toString());
    }
    if (paramsInput.sort) {
      params = params.set('sort', paramsInput.sort);
    }
    if (paramsInput.limit) {
      params = params.set('limit', paramsInput.limit.toString());
    }

    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/courses/search`, { params }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * 6. GET /categories
   * Public
   * Returns: Category[] dengan courses_count
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * 7. GET /home
   * Public
   * Params: limit (default 5)
   * Returns: HomeData (trending, category_sections, newest)
   */
  getHomeData(limit: number = 5): Observable<HomeData> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<HomeData>>(`${this.apiUrl}/home`, { params }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * 8. GET /courses/{id}/check-access
   * AUTH REQUIRED
   * Returns: boolean (akses atau tidak)
   */
  checkCourseAccess(courseId: number): Observable<boolean> {
    return this.http.get<ApiResponse<{ hasAccess: boolean }>>(`${this.apiUrl}/courses/${courseId}/check-access`).pipe(
      map(response => response.data.hasAccess),
      catchError(this.handleError)
    );
  }

  /**
   * Alias untuk backward compatibility
   */
  checkAccess(id: number): Observable<boolean> {
    return this.checkCourseAccess(id);
  }

  /**
   * 9. GET /my-learning
   * AUTH REQUIRED
   * Returns: Course[]
   */
  getMyLearning(): Observable<Course[]> {
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/my-learning`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // ── LESSON ENDPOINTS ──────────────────────────────────────

  /**
   * GET /student/courses/{courseId}/lessons
   * Returns: Lesson[]
   */
  getLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<ApiResponse<Lesson[]>>(`${this.apiUrl}/student/courses/${courseId}/lessons`).pipe(
      map(response => response.data || (response as any)),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/courses/{courseId}/lessons/{lessonId}
   * Returns: LessonDetail
   */
  getLessonDetail(courseId: number, lessonId: number): Observable<LessonDetail> {
    return this.http.get<ApiResponse<LessonDetail>>(`${this.apiUrl}/student/courses/${courseId}/lessons/${lessonId}`).pipe(
      map(response => response.data || (response as any)),
      catchError(this.handleError)
    );
  }

  /**
   * POST /student/courses/{courseId}/lessons/{lessonId}/complete
   */
  markComplete(courseId: number, lessonId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/student/courses/${courseId}/lessons/${lessonId}/complete`,
      {}
    ).pipe(
      map(response => response.data || (response as any)),
      catchError(this.handleError)
    );
  }

  /**
   * Generic error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Terjadi kesalahan pada sistem.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nPesan: ${error.message}`;
      }
    }
    console.error('CourseService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
