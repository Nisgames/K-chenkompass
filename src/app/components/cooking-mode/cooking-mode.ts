import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
export class CookingModeComponent implements OnInit {

  recipe: Recipe | undefined;
  currentStepIndex: number = 0; // Wir starten bei Schritt 0 (Erster Schritt)
  isLoading: boolean = true;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private cd = inject(ChangeDetectorRef);

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
  }

  // --- NAVIGATION ---

  // Gehe einen Schritt weiter
  nextStep() {
    if (this.recipe && this.currentStepIndex < this.recipe.steps.length - 1) {
      this.currentStepIndex++;
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
