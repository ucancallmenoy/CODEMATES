import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicComponent } from './public.component';
import { HomeComponent } from './pages/home/home.component';
import { ChatRoomComponent } from './pages/chat-room/chat-room.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from '../guards/auth.guard';
import { AuthRedirectGuard } from '../guards/auth-redirect.guard';
const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [AuthRedirectGuard]
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [AuthRedirectGuard] 
  },
  
  // Protected routes (require auth)
  {
    path: '',
    component: PublicComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'chat-room', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'chat-room', component: ChatRoomComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }