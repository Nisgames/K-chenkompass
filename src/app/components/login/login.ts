import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  cd = inject(ChangeDetectorRef);

  errorMessage: string = '';
  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async onSubmit() {
    // Nichts tun, wenn Formular ungültig
    if (this.loginForm.invalid) return;

    // Reset vor dem neuen Versuch
    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      // Versuch einzuloggen
      await this.authService.login(email!, password!);

      // Wenn das hier erreicht wird, war es erfolgreich -> Weiterleiten
      this.router.navigate(['/']);

    } catch (err: any) {
      console.error('Login Error:', err);

      // Fehlertext setzen
      // Wir prüfen den Status-Code, um nett zu sein
      if (err.status === 400) {
        this.errorMessage = 'E-Mail oder Passwort falsch. Bitte versuche es erneut.';
      } else {
        this.errorMessage = 'Ein unbekannter Fehler ist aufgetreten. Ist der Server an?';
      }

    } finally {
      // DAS HIER IST DER SCHLÜSSEL:
      // Egal was passiert (Erfolg oder Crash), wir hören auf zu laden!
      this.isLoading = false;

      // Angular zwingen, das UI neu zu malen (damit die Message sofort erscheint)
      this.cd.detectChanges();
    }
  }
}
