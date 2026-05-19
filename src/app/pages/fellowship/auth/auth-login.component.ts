import { Component, Output, EventEmitter } from '@angular/core';
import { FellowshipService } from '../../../services/fellowship.service';

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss']
})
export class AuthLoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();

  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(private fellowshipService: FellowshipService) {}

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      this.error = 'Email and password are required';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.fellowshipService.signIn(this.email, this.password);
      this.loginSuccess.emit();
    } catch (err: any) {
      console.error('Login error:', err);
      this.error = err.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
