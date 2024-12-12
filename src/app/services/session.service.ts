import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionService {

  username: string = "";

  // Save user token to electron-store after login
  async saveToken(token: string): Promise<void> {
    if (window.electronStore) {
      await window.electronStore.set('userToken', token);
      console.log('Token saved:', token);
      this.username = token;
    } else {
      console.error('IN SESSION SERVICE Cannot save token, electronStore not available');
    }
  }

  // Get user token from electron-store to maintain session
  async getToken(): Promise<string | null> {
    if (window.electronStore) {
      try {
        const token = await window.electronStore.get('userToken');
        console.log('Token retrieved:', token.value);
        this.username = token.value || '';
        return Promise.resolve(token.value);
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    }
    console.error('electronStore not available');
    return null;
  }

  // Remove user token from electron-store during logout
  logout(): void {
    if (window.electronStore) {
      window.electronStore.delete('userToken');

      window.electronStore.clear();
      
      this.username = "";
      console.log('Token deleted');
    }
  }
  
  // Check if user is logged in by verifying if token exists
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token !== "";
  }
}