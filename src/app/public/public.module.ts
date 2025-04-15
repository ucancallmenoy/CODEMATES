import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';
import { SideNavbarComponent } from './components/side-navbar/side-navbar.component';
import { HomeComponent } from './pages/home/home.component';
import { ChatRoomComponent } from './pages/chat-room/chat-room.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { FirebaseDatePipe } from './components/pipe/custom-pipe';

@NgModule({
  declarations: [
    PublicComponent,
    SideNavbarComponent,
    HomeComponent,
    ChatRoomComponent,
    LoginComponent,
    RegisterComponent,
    FirebaseDatePipe
  ],
  imports: [
    CommonModule,
    PublicRoutingModule,
    FormsModule
  ],
  exports: [
    FirebaseDatePipe
  ]
})
export class PublicModule { }
