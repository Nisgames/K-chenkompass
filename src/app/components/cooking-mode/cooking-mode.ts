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

  // --- NAVIGATION ---

  // Gehe einen Schritt weiter
  nextStep() {
    if (this.recipe && this.currentStepIndex < this.recipe.steps.length - 1) {
      this.currentStepIndex++;
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
