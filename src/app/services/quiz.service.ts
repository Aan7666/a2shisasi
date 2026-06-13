import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, Quiz, QuizAnswer } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * GET /student/courses/:courseId/quizzes
   * Returns: Quiz[]
   */
  getStudentQuizzes(courseId: number): Observable<Quiz[]> {
    return this.http.get<ApiResponse<Quiz[]>>(`${this.apiUrl}/student/courses/${courseId}/quizzes`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/quizzes/:quizId
   * Returns: Quiz
   */
  getQuiz(quizId: number): Observable<Quiz> {
    return this.http.get<ApiResponse<Quiz>>(`${this.apiUrl}/student/quizzes/${quizId}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * POST /student/quizzes/:quizId/submit
   * Returns: any (quiz attempt result, certificate generated information)
   */
  submitQuiz(quizId: number, answers: QuizAnswer[]): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/student/quizzes/${quizId}/submit`, { answers }).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /student/quizzes/:quizId/result
   * Returns: any
   */
  getResult(quizId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/student/quizzes/${quizId}/result`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * POST /instructor/courses/:courseId/quizzes
   * Returns: Quiz
   */
  store(courseId: number, data: any): Observable<Quiz> {
    return this.http.post<ApiResponse<Quiz>>(`${this.apiUrl}/instructor/courses/${courseId}/quizzes`, data).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * PUT /instructor/quizzes/:quizId
   * Returns: Quiz
   */
  update(quizId: number, data: any): Observable<Quiz> {
    return this.http.put<ApiResponse<Quiz>>(`${this.apiUrl}/instructor/quizzes/${quizId}`, data).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /instructor/quizzes/:quizId
   */
  destroy(quizId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/instructor/quizzes/${quizId}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * POST /instructor/quizzes/:quizId/questions
   */
  storeQuestion(quizId: number, data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/instructor/quizzes/${quizId}/questions`, data).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * PUT /instructor/questions/:questionId
   */
  updateQuestion(questionId: number, data: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/instructor/questions/${questionId}`, data).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /instructor/questions/:questionId
   */
  destroyQuestion(questionId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/instructor/questions/${questionId}`).pipe(
      map(res => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * GET /instructor/quizzes/:quizId/results
   */
  getInstructorResults(quizId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/instructor/quizzes/${quizId}/results`).pipe(
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
import { QuizService } from '../../services/quiz.service';
import { Quiz, QuizAnswer } from '../../models';

@Component({
  selector: 'app-quiz-attempt',
  template: '...'
})
export class QuizAttemptComponent implements OnInit {
  quiz: Quiz | null = null;
  answers: QuizAnswer[] = [];

  constructor(private quizService: QuizService) {}

  ngOnInit() {
    this.quizService.getQuiz(1).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
      }
    });
  }

  selectOption(questionId: number, optionId: number) {
    const existing = this.answers.find(a => a.questionId === questionId);
    if (existing) {
      existing.optionId = optionId;
    } else {
      this.answers.push({ questionId, optionId });
    }
  }

  onSubmit() {
    if (!this.quiz) return;
    this.quizService.submitQuiz(this.quiz.id, this.answers).subscribe({
      next: (result) => {
        console.log('Quiz submitted! Result:', result);
        // result.score, result.is_passed, result.certificate_generated
      }
    });
  }
}
*/
