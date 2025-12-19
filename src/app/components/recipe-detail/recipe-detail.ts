import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Um die URL zu lesen
import { FormsModule } from '@angular/forms'; // WICHTIG: Für das Input-Feld (Rechner)

import { RecipeService } from '../../services/recipe';
import { Recipe } from '../../models/recipe.model';
import {AuthService} from '../../services/auth';

interface ParsedIngredient {
  originalAmount: number | null;
  text: string; // Einheit + Name (z.B. "g Mehl")
  fullString: string; // Fallback, falls keine Zahl gefunden wurde (z.B. "Salz")
}

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // FormsModule nicht vergessen!
  templateUrl: './recipe-detail.html', // Achte auf DEINE Dateinamen
  styleUrl: './recipe-detail.scss'
})
export class RecipeDetail implements OnInit {

  recipe: Recipe | undefined;

  parsedIngredients: ParsedIngredient[] = [];
  // Für den Portionsrechner (Standardwert, wird gleich überschrieben)
  currentServings: number = 1;
  isLoading: boolean = true;

  // Status für das Herz
  isFavorite = false;
  isToggling = false;

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
          this.parseIngredients();
          this.checkIfFavorite();
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

  // NEU: Prüfen beim Start
  checkIfFavorite() {
    const currentUser = this.authService.currentUser();
    if (this.recipe && currentUser) {
      // Wir schauen direkt ins Auth-Model, das ist am schnellsten
      const favs = currentUser['favoriteRecipes'] || [];
      this.isFavorite = favs.includes(this.recipe.id);
    }
  }

  // NEU: Klick Handler
  async toggleFav() {
    if (this.isToggling || !this.recipe) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.isToggling = true;

    // Optimistisches UI-Update (sofort umschalten, bevor Server antwortet)
    this.isFavorite = !this.isFavorite;

    try {
      const result = await this.recipeService.toggleFavorite(currentUser.id, this.recipe.id);
      this.isFavorite = result; // Sicherstellen, dass der Server-Stand stimmt

      // Auth Store refreshen (damit die Liste im Hintergrund aktuell bleibt)
      await this.authService.pb.collection('users').authRefresh();

    } catch (err) {
      console.error(err);
      this.isFavorite = !this.isFavorite; // Rollback bei Fehler
    } finally {
      this.isToggling = false;
      this.cd.detectChanges();
    }
  }

  // NEU: Hilfsfunktion zum Zerlegen der Strings
  private parseIngredients() {
    if (!this.recipe) return;

    this.parsedIngredients = this.recipe.ingredients.map(ing => {
      // Regex sucht nach einer Zahl am Anfang (erlaubt "1.5", "1,5", "100")
      // ^([\d.,]+) -> Gruppe 1: Die Zahl
      // \s+(.*)    -> Gruppe 2: Der Rest (Einheit + Name)
      const match = ing.match(/^([\d.,]+)\s+(.*)$/);

      if (match) {
        // Komma zu Punkt konvertieren für JS-Math
        const rawNum = match[1].replace(',', '.');
        const number = parseFloat(rawNum);

        if (!isNaN(number)) {
          return {
            originalAmount: number,
            text: match[2],     // z.B. "EL Olivenöl"
            fullString: ing
          };
        }
      }

      // Fallback: Keine Zahl gefunden (z.B. "Salz und Pfeffer")
      return {
        originalAmount: null,
        text: ing,
        fullString: ing
      };
    });
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
