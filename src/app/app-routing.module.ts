import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadChildren: () => import('./splash/splash.module').then( m => m.SplashPageModule)
  },
  {
    path: 'privacy-policy',
    loadChildren: () => import('./privacy-policy/privacy-policy.module').then( m => m.PrivacyPolicyPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'lupa-password',
    loadChildren: () => import('./lupa-password/lupa-password.module').then( m => m.LupaPasswordPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./before-login/tabs/tabs.module').then( m => m.TabsPageModule)
  },
  {
    path: 'tabs-after-login',
    loadChildren: () => import('./after-login/tabs-after-login/tabs.module').then( m => m.TabsPageModule)
  },
  { // <--- TAMBAHKAN BAGIAN INI
    path: 'home',
    loadChildren: () => import('./before-login/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'keranjang',
    loadChildren: () => import('./keranjang/keranjang.module').then( m => m.KeranjangPageModule)
  },
  {
    path: 'detail-course/:id',
    loadChildren: () => import('./detail-course/detail-course.module').then( m => m.DetailCoursePageModule)
  },
  {
    path: 'checkout',
    loadChildren: () => import('./checkout/checkout.module').then( m => m.CheckoutPageModule)
  },
  {
    path: 'video-materi',
    loadChildren: () => import('./video-materi/video-materi.module').then( m => m.VideoMateriPageModule)
  },
  {
    path: 'history',
    loadChildren: () => import('./history/history.module').then( m => m.HistoryPageModule)
  },
  {
    path: 'about-us',
    loadChildren: () => import('./about-us/about-us.module').then( m => m.AboutUsPageModule)
  },
  {
    path: 'help-and-support',
    loadChildren: () => import('./help-and-support/help-and-support.module').then( m => m.HelpAndSupportPageModule)
  },
  {
    path: 'quiz-attempt/:id',
    loadChildren: () => import('./quiz-attempt/quiz-attempt.module').then( m => m.QuizAttemptPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }