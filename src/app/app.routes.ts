import { Routes } from '@angular/router';
import { RecipeList } from './components/recipe-list/recipe-list'; // Dein Pfad
import { RecipeDetail } from './components/recipe-detail/recipe-detail'; // Standard-Pfad (prüfen!)
import { RecipeEditor } from './components/recipe-editor/recipe-editor';
import { CookingModeComponent } from './components/cooking-mode/cooking-mode';

export const routes: Routes = [
  { path: '', component: RecipeList },
  { path: 'recipe/new', component: RecipeEditor },
  { path: 'recipe/:id/edit', component: RecipeEditor },
  { path: 'recipe/:id', component: RecipeDetail },

  // NEU: Der Koch-Modus (Kind-Element der ID ist hier nicht nötig, wir machen eine eigene Route)
  { path: 'recipe/:id/cook', component: CookingModeComponent },

  // Falls jemand Quatsch eingibt, leite zur Startseite um
  { path: '**', redirectTo: '' }
];
