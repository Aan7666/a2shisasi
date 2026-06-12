import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Course } from './course.service';

export interface InstructorDashboard {
  totalCourses: number;
  totalStudents: number;
  totalPublished: number;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  status?: 'draft' | 'published';
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  status?: 'draft' | 'published' | 'archived';
}

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // GET /api/instructor/dashboard
  getDashboard(): Observable<InstructorDashboard> {
    return this.http.get<any>(`${this.apiUrl}/instructor/dashboard`).pipe(
      map(response => response?.data || response)
    );
  }

  // GET /api/instructor/courses
  getCourses(): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}/instructor/courses`).pipe(
      map(response => {
        if (response?.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      })
    );
  }

  // POST /api/instructor/courses
  createCourse(payload: CreateCoursePayload): Observable<Course> {
    return this.http.post<any>(`${this.apiUrl}/instructor/courses`, payload).pipe(
      map(response => response?.data || response)
    );
  }

  // PUT /api/instructor/courses/{id}
  updateCourse(id: number, payload: UpdateCoursePayload): Observable<Course> {
    return this.http.put<any>(`${this.apiUrl}/instructor/courses/${id}`, payload).pipe(
      map(response => response?.data || response)
    );
  }

  // DELETE /api/instructor/courses/{id}
  deleteCourse(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/instructor/courses/${id}`);
  }
}
