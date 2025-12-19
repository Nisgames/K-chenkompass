import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // <--- ChangeDetectorRef importieren
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RecipeService } from '../../services/recipe';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent implements OnInit {
  public authService = inject(AuthService); // Public damit HTML drauf zugreifen kann
  private recipeService = inject(RecipeService);
  private cd = inject(ChangeDetectorRef); // <--- INJECTEN

  myRecipes: Recipe[] = [];
  favoriteRecipes: Recipe[] = [];
  isLoading = true;

  ngOnInit() {
    const currentUser = this.authService.currentUser();

    if (currentUser) {
      this.recipeService.getRecipesByAuthor(currentUser.id).subscribe({
        next: (data) => {
          this.myRecipes = data;
          console.log('Rezepte geladen:', data.length); // Debug
          this.cd.detectChanges(); // <--- WICHTIG: UI aktualisieren!
        },
        error: (err) => {
          console.error(err);
          this.cd.detectChanges(); // <--- Auch bei Fehler
        }
      });

      // 2. NEU: Favoriten laden
      this.recipeService.getFavoriteRecipes(currentUser.id).subscribe({
        next: (data) => {
          this.favoriteRecipes = data;
          console.log('Favoriten:', data);
          this.cd.detectChanges();
        },
        error: (err) => console.error('Fehler beim Laden der Favoriten', err)
      });

      this.isLoading = false;

    } else {
      // Falls kein User da ist (sollte dank Guard nicht passieren, aber sicher ist sicher)
      this.isLoading = false;
      this.cd.detectChanges();
    }
  }
}
