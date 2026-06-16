import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { QuizAttemptPage } from './quiz-attempt.page';

const routes: Routes = [
  {
    path: '',
    component: QuizAttemptPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuizAttemptPageRoutingModule {}
