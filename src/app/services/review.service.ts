import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from './course.interfaces';

export interface StudentReviewInfo {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Review {
  id: number;
  course_id: number;
  student_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  student?: StudentReviewInfo;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * GET /api/courses/{id}/reviews
   * Mengambil semua review untuk course tertentu (public)
   */
  getCourseReviews(courseId: number): Observable<Review[]> {
    return this.http
      .get<ApiResponse<Review[]>>(`${this.apiUrl}/courses/${courseId}/reviews`)
      .pipe(
        map(res => res.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * POST /api/student/courses/{courseId}/reviews
   * Menambahkan review baru (auth)
   */
  createReview(courseId: number, rating: number, comment: string): Observable<Review> {
    const body = {
      rating: rating,
      comment: comment || null
    };
    return this.http
      .post<ApiResponse<Review>>(`${this.apiUrl}/student/courses/${courseId}/reviews`, body)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * PUT /api/reviews/{id}
   * Memperbarui review milik sendiri (auth)
   */
  updateReview(reviewId: number, rating: number, comment: string): Observable<Review> {
    const body = {
      rating: rating,
      comment: comment || null
    };
    return this.http
      .put<ApiResponse<Review>>(`${this.apiUrl}/reviews/${reviewId}`, body)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE /api/reviews/{id}
   * Menghapus review milik sendiri (auth)
   */
  deleteReview(reviewId: number): Observable<any> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/reviews/${reviewId}`)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/student/courses/{courseId}/reviews/me
   * Mengambil review milik student yang sedang login untuk course tsb
   */
  getMyReview(courseId: number): Observable<Review | null> {
    return this.http
      .get<ApiResponse<Review | null>>(`${this.apiUrl}/student/courses/${courseId}/reviews/me`)
      .pipe(
        map(res => res.data),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Terjadi kesalahan saat memproses ulasan.';
    if (error.error && error.error.message) {
      msg = error.error.message;
    } else if (error.error instanceof ErrorEvent) {
      msg = error.error.message;
    } else {
      msg = `Error ${error.status}: ${error.message}`;
    }
    console.error('[ReviewService] Error:', error);
    return throwError(() => new Error(msg));
  }
}
