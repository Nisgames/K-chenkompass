import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Wichtig
import { Observable } from 'rxjs';
import { Recipe } from '../models/recipe.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  // Die Adresse unseres Backends
  // WICHTIG: Hier die Variable nutzen statt hartem String
  private apiUrl = environment.apiUrl;

  // Wir brauchen den HttpClient
  private http = inject(HttpClient);

  // 1. Alle Rezepte laden
  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.apiUrl);
  }

  // 2. Ein einzelnes Rezept laden
  getRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${id}`);
  }

  // 3. Neues Rezept speichern
  addRecipe(recipe: Recipe): Observable<Recipe> {
    // ID wird vom JSON-Server automatisch generiert, wenn wir sie weglassen,
    // oder wir generieren sie selbst. JSON-Server mag Strings als IDs.
    if (!recipe.id) {
      recipe.id = Math.random().toString(36).substring(2, 9);
    }
    return this.http.post<Recipe>(this.apiUrl, recipe);
  }
}
