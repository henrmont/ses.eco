import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { MessageService } from '../../services/message-service';

@Component({
  selector: 'app-login-component',
  imports: [FormsModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {

  authForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
  ) {
    this.authForm = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]]
    });
  }

  onAuthSubmit() {
    this.authService.login(this.authForm.value).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.access_token);
      },
      error: (err) => {
        this.messageService.showMessage('Erro ao efetuar login. Verifique suas credenciais.');
      },
      complete: () => {
        this.router.navigate(['/principal']);
      }
    })
  }

}
