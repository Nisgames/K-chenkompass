import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe';
import { Recipe } from '../../models/recipe.model';
import { HammerModule } from '@angular/platform-browser';

@Component({
  selector: 'app-cooking-mode',
  standalone: true,
  imports: [CommonModule, RouterModule, HammerModule],
  templateUrl: './cooking-mode.html', // <--- Pfad anpassen
  styleUrl: './cooking-mode.scss'      // <--- Pfad anpassen
})
export class CookingModeComponent implements OnInit, OnDestroy {

  recipe: Recipe | undefined;
  currentStepIndex: number = 0; // Wir starten bei Schritt 0 (Erster Schritt)
  isLoading: boolean = true;

  // NEU: Steuert das Zutaten-Overlay
  showIngredients = false;
// NEU: Ein Set, das speichert, welche Zutaten (Indices) gerade "aktiv" sind
  activeIngredientIndices = new Set<number>();

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private cd = inject(ChangeDetectorRef);
  public wakeLock: any = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recipeService.getRecipeById(id).subscribe({
        next: (data) => {
          this.recipe = data;
          this.checkIngredientsForStep();
          this.isLoading = false; // Fertig!
          this.cd.detectChanges(); // Update erzwingen
        },
        error: (err) => {
          console.error('Fehler beim Laden:', err);
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
    this.requestWakeLock();
  }

  ngOnDestroy(): void {
    // NEU: Wake Lock freigeben, wenn wir die Komponente verlassen
    this.releaseWakeLock();
  }

  // NEU: Toggle Funktion
  toggleIngredients() {
    this.showIngredients = !this.showIngredients;
  }

  // --- HELPER: TEXT ANALYSE ---
  private checkIngredientsForStep() {
    if (!this.recipe) return;

    const currentStepText = this.recipe.steps[this.currentStepIndex].toLowerCase();
    this.activeIngredientIndices.clear();

    this.recipe.ingredients.forEach((ing, index) => {
      let cleanName = ing.toLowerCase();

      // SCHRITT 1: Zahlen und Sonderzeichen weg (bleibt gleich)
      cleanName = cleanName.replace(/[\d,.]+/g, '');

      // SCHRITT 2 (FIX): Einheiten nur als GANZES Wort entfernen!
      // \b steht für "Wortgrenze". So bleibt das 'l' in 'Milch' am Leben.
      const unitsRegex = /\b(g|kg|ml|l|el|tl|stk|bund|prise|pck|dose)\b/g;
      cleanName = cleanName.replace(unitsRegex, '').trim();

      // Sicherheits-Check: Ist noch was übrig?
      if (cleanName.length < 2) return;

      // SCHRITT 3: Prüfen
      const parts = cleanName.split(' ');
      const isMatch = parts.some(part =>
        part.length > 2 && currentStepText.includes(part)
      );

      if (isMatch) {
        this.activeIngredientIndices.add(index);
      }
    });
  }

  // --- NAVIGATION ---

  // Gehe einen Schritt weiter
  nextStep() {
    if (this.recipe && this.currentStepIndex < this.recipe.steps.length - 1) {
      this.currentStepIndex++;
      this.checkIngredientsForStep();
    }
  }

  // NEU: Reagieren, wenn der User den Tab wechselt oder minimiert
  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Wenn User zurückkommt: Versuch, den Lock wieder zu holen
      this.requestWakeLock();
    }
  }

  // --- WAKE LOCK LOGIC ---
  private async requestWakeLock() {
    try {
      // Prüfen, ob der Browser das kann
      if ('wakeLock' in navigator) {
        // @ts-ignore (Falls TS meckert, dass es navigator.wakeLock nicht kennt)
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('💡 Display bleibt an!');
      }
    } catch (err) {
      console.warn('Wake Lock fehlgeschlagen:', err);
    }
  }

  private async releaseWakeLock() {
    if (this.wakeLock !== null) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('🌑 Display darf wieder schlafen.');
    }
  }

  // Gehe einen Schritt zurück
  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.checkIngredientsForStep();
    }
  }

  // Modus beenden
  exit() {
    // Zurück zur Detail-Ansicht
    if (this.recipe) {
      this.router.navigate(['/recipe', this.recipe.id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
