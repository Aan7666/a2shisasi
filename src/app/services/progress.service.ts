import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, ProgressSummary } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * POST /student/progress
   * Marks a lesson completed.
   * Returns: any (contains progress info, completedLessons, percentage)
   */
  markComplete(courseId: number, lessonId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/student/progress`, { course_id: courseId, lesson_id: lessonId }).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/progress/course/:courseId
   * Returns: ProgressSummary
   */
  getByCourse(courseId: number): Observable<ProgressSummary> {
    return this.http.get<ApiResponse<ProgressSummary>>(`${this.apiUrl}/student/progress/course/${courseId}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/progress
   * Returns: ProgressSummary[]
   */
  getMyProgress(): Observable<ProgressSummary[]> {
    return this.http.get<ApiResponse<ProgressSummary[]>>(`${this.apiUrl}/student/progress`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /instructor/courses/:courseId/progress
   */
  getInstructorProgress(courseId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/instructor/courses/${courseId}/progress`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Terjadi kesalahan sistem.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}

/*
=== CONTOH CARA PEMAKAIAN DI KOMPONEN ===
import { Component, OnInit } from '@angular/core';
import { ProgressService } from '../../services/progress.service';
import { ProgressSummary } from '../../models';

@Component({
  selector: 'app-course-progress',
  template: '...'
})
export class CourseProgressComponent implements OnInit {
  progress: ProgressSummary | null = null;

  constructor(private progressService: ProgressService) {}

  ngOnInit() {
    this.progressService.getByCourse(1).subscribe({
      next: (summary) => {
        this.progress = summary;
      }
    });
  }

  completeLesson(lessonId: number) {
    this.progressService.markComplete(1, lessonId).subscribe({
      next: (res) => {
        console.log('Progress updated:', res);
        // res.percentage, res.completedLessons
        this.ngOnInit(); // Reload progress data
      }
    });
  }
}
*/
