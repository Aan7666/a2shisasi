import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HelpAndSupportPageRoutingModule } from './help-and-support-routing.module';

import { HelpAndSupportPage } from './help-and-support.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelpAndSupportPageRoutingModule
  ],
  declarations: [HelpAndSupportPage]
})
export class HelpAndSupportPageModule {}
