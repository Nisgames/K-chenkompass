import { Component, OnInit, inject } from '@angular/core';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe';
import { CommonModule } from '@angular/common'; // Wichtig für Währung, Datum pipes etc.
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import {AuthService} from '../../services/auth';

@Component({
  selector: 'app-recipe-list',
  standalone: true, // Modernes Angular (keine Modules mehr nötig)
  imports: [CommonModule, RouterModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss'
})
export class RecipeList implements OnInit {

  recipes: Recipe[] = [];
  allRecipes: Recipe[] = [];

  // Neue Merkzettel für den aktuellen Filter-Status
  searchQuery: string = '';
  selectedCategory: string = 'Alle';

  private recipeService = inject(RecipeService);
  private cd = inject(ChangeDetectorRef);

  // ...
  public authService = inject(AuthService); // Public!
// ...

  ngOnInit(): void {
    this.recipeService.getRecipes().subscribe(data => {
      this.allRecipes = data;

      // Filter anwenden (befüllt this.recipes)
      this.applyFilters();

      console.log('Rezepte gesetzt:', this.recipes.length); // Debug check

      // WICHTIG: Angular zwingen, die Ansicht zu aktualisieren
      this.cd.detectChanges(); // <--- 3. Der Weckruf!
    });
  }

  // 1. Wird aufgerufen, wenn man tippt
  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value.toLowerCase();
    this.applyFilters(); // Wir rufen immer die Haupt-Filter-Funktion auf
  }

  // 2. Wird aufgerufen, wenn man einen Button klickt
  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  // 3. Die Haupt-Funktion: Prüft BEIDES (Text & Kategorie)
  private applyFilters() {
    this.recipes = this.allRecipes.filter(recipe => {
      // Prüfe Text
      const matchesSearch = recipe.title.toLowerCase().includes(this.searchQuery);

      // Prüfe Kategorie (Wenn 'Alle' gewählt ist, passt alles)
      const matchesCategory = this.selectedCategory === 'Alle' || recipe.category === this.selectedCategory;

      // Beides muss wahr sein
      return matchesSearch && matchesCategory;
    });
  }
}
