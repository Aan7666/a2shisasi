import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, Lesson } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * GET /student/courses/:courseId/lessons
   * Returns: Lesson[]
   */
  getStudentLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<ApiResponse<Lesson[]>>(`${this.apiUrl}/student/courses/${courseId}/lessons`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/courses/:courseId/lessons/:lessonId
   * Returns: Lesson
   */
  getStudentLesson(courseId: number, lessonId: number): Observable<Lesson> {
    return this.http.get<ApiResponse<Lesson>>(`${this.apiUrl}/student/courses/${courseId}/lessons/${lessonId}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /instructor/courses/:courseId/lessons
   * Returns: Lesson[]
   */
  getInstructorLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<ApiResponse<Lesson[]>>(`${this.apiUrl}/instructor/courses/${courseId}/lessons`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * POST /instructor/courses/:courseId/lessons
   * Gunakan FormData karena ada file upload (video/pdf)
   * Returns: Lesson
   */
  store(courseId: number, formData: FormData): Observable<Lesson> {
    return this.http.post<ApiResponse<Lesson>>(`${this.apiUrl}/instructor/courses/${courseId}/lessons`, formData).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * PUT /instructor/lessons/:lessonId
   * Gunakan FormData karena ada file upload (video/pdf)
   * Returns: Lesson
   */
  update(lessonId: number, formData: FormData): Observable<Lesson> {
    // Note: Laravel PHP terkadang memerlukan method spoofing '_method' = 'PUT' 
    // jika dikirim melalui FormData via POST. 
    // Anda bisa menambahkan formData.append('_method', 'PUT') di component sebelum memanggil ini.
    return this.http.post<ApiResponse<Lesson>>(`${this.apiUrl}/instructor/lessons/${lessonId}`, formData).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /instructor/lessons/:lessonId
   */
  destroy(lessonId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/instructor/lessons/${lessonId}`).pipe(
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
import { Component } from '@angular/core';
import { LessonService } from '../../services/lesson.service';

@Component({
  selector: 'app-lesson-upload',
  template: '...'
})
export class LessonUploadComponent {
  selectedFile: File | null = null;
  title: string = '';

  constructor(private lessonService: LessonService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('type', 'video');
    formData.append('description', 'Materi video baru');
    formData.append('order', '1');
    formData.append('status', 'published');
    formData.append('file', this.selectedFile); // File video/pdf

    this.lessonService.store(1, formData).subscribe({
      next: (lesson) => {
        console.log('Lesson uploaded successfully:', lesson);
      },
      error: (err) => {
        console.error('Upload failed:', err.message);
      }
    });
  }
}
*/
