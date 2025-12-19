import { Routes } from '@angular/router';
import { RecipeList } from './components/recipe-list/recipe-list'; // Dein Pfad
import { RecipeDetail } from './components/recipe-detail/recipe-detail'; // Standard-Pfad (prüfen!)
import { RecipeEditor } from './components/recipe-editor/recipe-editor';
import { CookingModeComponent } from './components/cooking-mode/cooking-mode';
import {LoginComponent} from './components/login/login';
import { authGuard } from './guards/auth.guard';
import {RegisterComponent} from './components/register/register';
import {UserProfileComponent} from './components/user-profile/user-profile';

export const routes: Routes = [
  { path: '', component: RecipeList },

  // NUR MIT TICKET (Guard)
  {
    path: 'recipe/new',
    component: RecipeEditor,
    canActivate: [authGuard] // <--- Der Türsteher
  },
  {
    path: 'recipe/:id/edit',
    component: RecipeEditor,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard] // Nur für eingeloggte User
  },

  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recipe/:id', component: RecipeDetail },
  { path: 'recipe/:id/cook', component: CookingModeComponent },
  { path: '**', redirectTo: '' }
];
