import { Injectable, inject } from '@angular/core';
import PocketBase from 'pocketbase';
import { Observable, from, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recipe } from '../models/recipe.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private authService = inject(AuthService);

  // Getter für bequemen Zugriff (optional, oder direkt this.authService.pb nutzen)
  private get pb(): PocketBase {
    return this.authService.pb;
  }

  constructor() {
    // Verbindung herstellen
  }

  // --- HILFSFUNKTION: Daten von PocketBase in unser Format umwandeln ---
  private mapRecordToRecipe(record: any): Recipe {
    // Bild-URL zusammenbauen: http://server/api/files/COLLECTION/ID/FILENAME
    const imageUrl = record.imageUrl
      ? this.pb.files.getURL(record, record.imageUrl)
      : '';
    // Wir schauen, ob 'author' expandiert wurde und holen den username
    const authorName = record.expand?.author?.username || 'Unbekannter Koch';

    // --- 2. ZUTATEN LOGIK ---
    let ingredients = record.ingredients;

    // Falls PocketBase die Zutaten als Text-String schickt (z.B. "[...]")
    // statt als echtes Array, parsen wir es manuell.
    if (typeof ingredients === 'string') {
      try {
        ingredients = JSON.parse(ingredients);
      } catch (e) {
        console.warn('Konnte Zutaten nicht parsen:', ingredients);
        ingredients = [];
      }
    }

    // Das gleiche für Steps
    let steps = record.steps;
    if (typeof steps === 'string') {
      try {
        steps = JSON.parse(steps);
      } catch (e) {
        steps = [];
      }
    }

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      durationMinutes: record.durationMinutes,
      servings: record.servings,
      category: record.category,
      isPrivate: record.isPrivate,
      imageUrl: imageUrl, // Hier ist jetzt die fertige URL drin!
      ingredients: record.ingredients || [], // Falls leer, leeres Array
      steps: record.steps || [],
      author: record.author,
      authorName: authorName,
    } as Recipe;
  }

  // --- API METHODEN ---

  // 1. Alle Rezepte holen
  getRecipes(): Observable<Recipe[]> {
    const promise = this.pb.collection('recipes').getFullList({
      sort: '-created',// Neueste zuerst
      expand: 'author',
    });

    // Promise in Observable umwandeln und Daten mappen
    return from(promise).pipe(
      map(records => records.map(r => this.mapRecordToRecipe(r)))
    );
  }

  // 2. Ein Rezept holen
  getRecipeById(id: string): Observable<Recipe> {
    const promise = this.pb.collection('recipes').getOne(id, {
      expand: 'author', // <--- WICHTIG
    });

    return from(promise).pipe(
      map(record => this.mapRecordToRecipe(record))
    );
  }

  // 3. Rezept erstellen (Jetzt mit FormData für Bilder!)
  createRecipe(formData: FormData): Observable<Recipe> {
    // PocketBase frisst FormData direkt
    const promise = this.pb.collection('recipes').create(formData, {
      expand: 'author'
    });
    return from(promise).pipe(map(record => this.mapRecordToRecipe(record)));
  }

  // --- NEU: 3b. Rezept aktualisieren ---
  updateRecipe(id: string, formData: FormData): Observable<Recipe> {
    const promise = this.pb.collection('recipes').update(id, formData, {
      expand: 'author'
    });
    return from(promise).pipe(map(record => this.mapRecordToRecipe(record)));
  }

  // 4. Rezept löschen (Bonus für später)
  deleteRecipe(id: string): Observable<boolean> {
    const promise = this.pb.collection('recipes').delete(id);
    return from(promise);
  }

  getRecipesByAuthor(userId: string): Observable<Recipe[]> {
    const promise = this.pb.collection('recipes').getFullList({
      sort: '-created',
      filter: `author = "${userId}"`, // <--- Der Filter-Trick
      expand: 'author',
    });

    return from(promise).pipe(
      map(records => records.map(r => this.mapRecordToRecipe(r)))
    );
  }

  // 6. Favoriten umschalten (Like / Unlike)
  // Wir geben zurück, ob es jetzt favorisiert ist (true) oder nicht (false)
  async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {

    // 1. Aktuellen User holen, um zu schauen, wie der Status IST
    const user = await this.pb.collection('users').getOne(userId);
    const favorites = user['favoriteRecipes'] || [];
    const isFavorite = favorites.includes(recipeId);

    // 2. Status umkehren
    if (isFavorite) {
      // Entfernen (-)
      await this.pb.collection('users').update(userId, {
        'favoriteRecipes-': recipeId
      });
      return false; // Jetzt nicht mehr Favorit
    } else {
      // Hinzufügen (+)
      await this.pb.collection('users').update(userId, {
        'favoriteRecipes+': recipeId
      });
      return true; // Jetzt Favorit
    }
  }

  // 7. Nur die Favoriten laden (fürs Profil)
  getFavoriteRecipes(userId: string): Observable<Recipe[]> {
    // Wir laden den User und "expanden" das Feld favoriteRecipes
    const promise = this.pb.collection('users').getOne(userId, {
      expand: 'favoriteRecipes'
    });

    return from(promise).pipe(
      map(user => {
        const favs = user.expand?.['favoriteRecipes'] || [];
        // Mappen wie gewohnt
        return favs.map((r: any) => this.mapRecordToRecipe(r));
      })
    );
  }

}
