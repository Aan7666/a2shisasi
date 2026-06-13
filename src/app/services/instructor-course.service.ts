import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, Course, InstructorDashboard } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class InstructorCourseService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * GET /instructor/courses
   * Returns Course[]
   */
  index(): Observable<Course[]> {
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/instructor/courses`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * POST /instructor/courses
   * Returns Course
   */
  store(data: any): Observable<Course> {
    return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/instructor/courses`, data).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * PUT /instructor/courses/:id
   * Returns Course
   */
  update(id: number, data: any): Observable<Course> {
    return this.http.put<ApiResponse<Course>>(`${this.apiUrl}/instructor/courses/${id}`, data).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /instructor/courses/:id
   */
  destroy(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/instructor/courses/${id}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /instructor/dashboard
   * Returns InstructorDashboard
   */
  getDashboard(): Observable<InstructorDashboard> {
    return this.http.get<ApiResponse<InstructorDashboard>>(`${this.apiUrl}/instructor/dashboard`).pipe(
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
import { InstructorCourseService } from '../../services/instructor-course.service';
import { Course } from '../../models';

@Component({
  selector: 'app-instructor-courses',
  template: '...'
})
export class InstructorCoursesComponent implements OnInit {
  courses: Course[] = [];

  constructor(private instructorCourseService: InstructorCourseService) {}

  ngOnInit() {
    this.instructorCourseService.index().subscribe({
      next: (courses) => {
        this.courses = courses;
      },
      error: (err) => {
        console.error('Gagal mengambil data courses:', err.message);
      }
    });
  }
}
*/
