import { Component, inject, ChangeDetectorRef } from '@angular/core'; // <--- 1. IMPORT HINZUFÜGEN
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: '../login/login.scss'
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  cd = inject(ChangeDetectorRef); // <--- 2. INJECTEN

  errorMessage = '';
  isLoading = false;

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', Validators.required]
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;

    const { email, password, passwordConfirm, username } = this.registerForm.value;

    if (password !== passwordConfirm) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.register(email!, password!, passwordConfirm!, username!);
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Fehler-Objekt:', err);

      // Fehler-Analyse
      if (err.data && err.data.data && err.data.data.username) {
        this.errorMessage = 'Der Benutzername ist bereits vergeben oder ungültig.';
      }
      if (err.data && err.data.data) {
        if (err.data.data.email) {
          this.errorMessage = 'Ungültige E-Mail (benutze z.B. test@beispiel.de) oder bereits vergeben.';
        } else if (err.data.data.password) {
          this.errorMessage = 'Das Passwort ist zu schwach (min. 8 Zeichen).';
        } else {
          this.errorMessage = 'Bitte überprüfe deine Eingaben.';
        }
      } else {
        // Fallback Fehler
        this.errorMessage = 'Registrierung fehlgeschlagen. Sind Registrierungen erlaubt? (API Rules)';
      }

    } finally {
      this.isLoading = false;
      this.cd.detectChanges(); // <--- 3. DER WECKRUF! Damit die UI aktualisiert wird.
    }
  }
}
