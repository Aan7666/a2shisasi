import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, Enrollment } from './course.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * POST /api/student/enrollments
   * Membeli / enroll ke sebuah course
   */
  enrollCourse(courseId: number): Observable<Enrollment> {
    return this.http.post<ApiResponse<Enrollment>>(`${this.apiUrl}/student/enrollments`, { course_id: courseId }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/student/enrollments
   * Mengambil daftar course yang sudah dibeli student
   */
  getMyEnrollments(): Observable<Enrollment[]> {
    return this.http.get<ApiResponse<Enrollment[]>>(`${this.apiUrl}/student/enrollments`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/student/enrollments/{id}
   * Mengambil detail pembelian
   */
  getEnrollmentDetail(id: number): Observable<Enrollment> {
    return this.http.get<ApiResponse<Enrollment>>(`${this.apiUrl}/student/enrollments/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/instructor/enrollments
   * Mengambil data pembelian untuk course instruktur
   */
  getInstructorEnrollments(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/instructor/enrollments`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Generic error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Terjadi kesalahan pada sistem.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nPesan: ${error.message}`;
      }
    }
    console.error('EnrollmentService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
