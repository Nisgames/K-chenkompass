import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Um die URL zu lesen
import { FormsModule } from '@angular/forms'; // WICHTIG: Für das Input-Feld (Rechner)

import { RecipeService } from '../../services/recipe';
import { Recipe } from '../../models/recipe.model';
import {AuthService} from '../../services/auth';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // FormsModule nicht vergessen!
  templateUrl: './recipe-detail.html', // Achte auf DEINE Dateinamen
  styleUrl: './recipe-detail.scss'
})
export class RecipeDetail implements OnInit {

  recipe: Recipe | undefined;

  // Für den Portionsrechner (Standardwert, wird gleich überschrieben)
  currentServings: number = 1;
  isLoading: boolean = true;

  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private cd = inject(ChangeDetectorRef);
  private router = inject(Router);

  public authService = inject(AuthService);

  // Helper Property
  get isOwner(): boolean {
    const currentUser = this.authService.currentUser();
    // Wir vergleichen die ID des Users mit der author-ID des Rezepts
    return this.recipe && currentUser && this.recipe.author === currentUser.id;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.recipeService.getRecipeById(id).subscribe({
        // Fall A: Erfolgreich geladen
        next: (data) => {
          this.recipe = data;
          this.currentServings = this.recipe.servings;
          this.isLoading = false; // Laden fertig
          this.cd.detectChanges(); // Ansicht aktualisieren!
        },
        // Fall B: Server meldet Fehler (z.B. wirklich falsche ID)
        error: (err) => {
          console.error(err);
          this.isLoading = false; // Laden fertig (aber erfolglos)
          this.cd.detectChanges();
        }
      });
    } else {
      this.isLoading = false;
    }
  }
  deleteRecipe() {
    // Einfache Sicherheitsabfrage
    if (confirm('Bist du sicher, dass du dieses Rezept löschen möchtest? 🗑️\nDas kann nicht rückgängig gemacht werden!')) {
      if (this.recipe && this.recipe.id) {
        this.isLoading = true; // Optional: Ladezustand anzeigen
        this.recipeService.deleteRecipe(this.recipe.id).subscribe({
          next: () => {
            // Erfolgreich gelöscht -> Ab zur Startseite
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Löschen fehlgeschlagen', err);
            alert('Fehler beim Löschen des Rezepts.');
            this.isLoading = false;
          }
        });
      }
    }
  }
}
