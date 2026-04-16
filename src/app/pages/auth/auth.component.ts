import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(g: AbstractControl) {
  const pw = g.get('password')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pw === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  tab: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  loginError = '';
  registerError = '';
  showLoginPwd = false;
  showRegisterPwd = false;
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    if (authService.isLoggedIn) {
      router.navigate([authService.isAdmin ? '/admin' : '/']);
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });
  }

  login(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading = true;
    this.loginError = '';
    const { email, password } = this.loginForm.value;
    const result = this.authService.login(email, password);
    this.loading = false;
    if (result.success) {
      this.router.navigate([this.authService.isAdmin ? '/admin' : '/']);
    } else {
      this.loginError = result.message;
    }
  }

  register(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.loading = true;
    this.registerError = '';
    const { name, email, password } = this.registerForm.value;
    const result = this.authService.register(name, email, password);
    this.loading = false;
    if (result.success) {
      this.router.navigate(['/']);
    } else {
      this.registerError = result.message;
    }
  }

  hasError(form: FormGroup, field: string, error: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }
}
