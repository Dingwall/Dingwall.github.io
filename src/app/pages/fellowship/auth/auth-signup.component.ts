import { Component, Output, EventEmitter } from '@angular/core';
import { FellowshipService } from '../../../services/fellowship.service';

@Component({
  selector: 'app-auth-signup',
  templateUrl: './auth-signup.component.html',
  styleUrls: ['./auth-signup.component.scss']
})
export class AuthSignupComponent {
  @Output() signupSuccess = new EventEmitter<void>();

  formData = {
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    address: ''
  };
  loading: boolean = false;
  error: string = '';

  constructor(private fellowshipService: FellowshipService) {}

  async signup(): Promise<void> {
    if (!this.formData.email || !this.formData.password || !this.formData.name) {
      this.error = 'Email, name, and password are required';
      return;
    }

    if (this.formData.password !== this.formData.passwordConfirm) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.fellowshipService.signUp({
        email: this.formData.email,
        password: this.formData.password,
        name: this.formData.name,
        phone: this.formData.phone,
        address: this.formData.address
      });
      this.signupSuccess.emit();
    } catch (err: any) {
      console.error('Signup error:', err);
      this.error = err.message || 'Signup failed';
    } finally {
      this.loading = false;
    }
  }
}
