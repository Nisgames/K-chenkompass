import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RecipeList } from './components/recipe-list/recipe-list';

@Component({
  selector: 'app-root',
  standalone: true,
  // WICHTIG: Steht RecipeListComponent hier im Array?
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'recipe-manager';
}
