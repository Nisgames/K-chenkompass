import { Injectable, signal } from '@angular/core';
import PocketBase from 'pocketbase';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Das ist unsere ZENTRALE PocketBase-Instanz
  public pb: PocketBase;

  // Ein Signal für die UI: Ist gerade wer eingeloggt?
  // Wir speichern direkt das User-Model (oder null)
  currentUser = signal<any>(null);

  constructor() {
    this.pb = new PocketBase(environment.apiUrl);

    // Initialer Status laden
    this.currentUser.set(this.pb.authStore.model);

    // Automatisch updaten, wenn sich was ändert (Login/Logout)
    this.pb.authStore.onChange(() => {
      this.currentUser.set(this.pb.authStore.model);
    });
  }

  // Login Methode
  async login(email: string, pass: string) {
    return await this.pb.collection('users').authWithPassword(email, pass);
  }

  // Logout Methode
  logout() {
    this.pb.authStore.clear();
  }

  // Helper: Sind wir eingeloggt?
  get isLoggedIn() {
    return this.pb.authStore.isValid;
  }

  // NEU: Registrierung
  async register(email: string, pass: string, passConfirm: string, username: string) {
    // 1. User erstellen
    const user = await this.pb.collection('users').create({
      email: email,
      password: pass,
      username: username,
      passwordConfirm: passConfirm,
      emailVisibility: true // Optional: Damit andere die Email sehen dürfen
    });

    // 2. Direkt danach einloggen (User Experience!)
    return await this.login(email, pass);
  }

  // Helper: Gib mir die aktuelle User ID
  get currentUserId() {
    return this.pb.authStore.model?.id;
  }
}
