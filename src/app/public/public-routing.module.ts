import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicComponent } from './public.component';
import { HomeComponent } from './pages/home/home.component';
import { ChatRoomComponent } from './pages/chat-room/chat-room.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    path: '', 
    component: PublicComponent, 
    canActivate: [AuthGuard],
    children: [
      {path: '', component: HomeComponent},
      {path: 'chat-room', component: ChatRoomComponent},
    ]
  },
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }