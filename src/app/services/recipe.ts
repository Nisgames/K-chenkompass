import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { Observable, from, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private pb: PocketBase;

  constructor() {
    // Verbindung herstellen
    this.pb = new PocketBase(environment.apiUrl);
  }

  // --- HILFSFUNKTION: Daten von PocketBase in unser Format umwandeln ---
  private mapRecordToRecipe(record: any): Recipe {
    // Bild-URL zusammenbauen: http://server/api/files/COLLECTION/ID/FILENAME
    const imageUrl = record.imageUrl
      ? this.pb.files.getUrl(record, record.imageUrl)
      : '';

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      durationMinutes: record.durationMinutes,
      servings: record.servings,
      category: record.category,
      imageUrl: imageUrl, // Hier ist jetzt die fertige URL drin!
      ingredients: record.ingredients || [], // Falls leer, leeres Array
      steps: record.steps || []
    } as Recipe;
  }

  // --- API METHODEN ---

  // 1. Alle Rezepte holen
  getRecipes(): Observable<Recipe[]> {
    const promise = this.pb.collection('recipes').getFullList({
      sort: '-created', // Neueste zuerst
    });

    // Promise in Observable umwandeln und Daten mappen
    return from(promise).pipe(
      map(records => records.map(r => this.mapRecordToRecipe(r)))
    );
  }

  // 2. Ein Rezept holen
  getRecipeById(id: string): Observable<Recipe> {
    const promise = this.pb.collection('recipes').getOne(id);

    return from(promise).pipe(
      map(record => this.mapRecordToRecipe(record))
    );
  }

  // 3. Rezept erstellen
  createRecipe(recipe: Omit<Recipe, 'id'>): Observable<Recipe> {
    // Achtung: Datei-Uploads behandeln wir später separat.
    // Hier senden wir erst mal die JSON Daten.
    const promise = this.pb.collection('recipes').create(recipe);

    return from(promise).pipe(
      map(record => this.mapRecordToRecipe(record))
    );
  }

  // 4. Rezept löschen (Bonus für später)
  deleteRecipe(id: string): Observable<boolean> {
    const promise = this.pb.collection('recipes').delete(id);
    return from(promise);
  }
}
