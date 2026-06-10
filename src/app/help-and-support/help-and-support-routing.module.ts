import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelpAndSupportPage } from './help-and-support.page';

const routes: Routes = [
  {
    path: '',
    component: HelpAndSupportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelpAndSupportPageRoutingModule {}
