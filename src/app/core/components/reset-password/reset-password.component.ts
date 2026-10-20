import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Core & Services & Validators
import { AuthService } from '../../services/auth-service';
import { MessageService } from '../../services/message-service';
import { CustomValidators } from '../../validators/custom.validator';

@Component({
  selector: 'app-reset-password-component',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected resetPasswordForm!: FormGroup;
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly hidePassword = signal<boolean>(true);
  protected readonly hideConfirmPassword = signal<boolean>(true);

  private token = '';
  private email = '';

  // Mapeamento de Mensagens de Erro Tipado
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    password: [
      { type: 'required', message: 'A nova senha é obrigatória.' },
      { type: 'minlength', message: 'A senha deve ter no mínimo 8 caracteres.' }
    ],
    password_confirmation: [
      { type: 'required', message: 'A confirmação da senha é obrigatória.' },
      { type: 'passwordMismatch', message: 'As senhas informadas não coincidem.' }
    ]
  };

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.extractRouteParams();
    this.initForm();
    this.setupFormSubmittingHandler();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template (Protected)
  // ==========================================
  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((value) => !value);
  }

  protected onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.token || !this.email) {
      this.messageService.showMessage('Token ou e-mail de redefinição ausente. Solicite uma nova recuperação.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      token: this.token,
      email: this.email,
      ...this.resetPasswordForm.getRawValue()
    };

    console.log(payload)

    this.authService.resetPassword(payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const successMsg = response?.message || 'Senha redefinida com sucesso!';
          this.messageService.showMessage(successMsg);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao redefinir sua senha. O link pode ter expirado.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private extractRouteParams(): void {
    // Captura o token diretamente da URL (/resetar-senha/:token)
    this.token = this.route.snapshot.paramMap.get('token') || '';

    // Captura o e-mail via query param (?email=...)
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.token || !this.email) {
      this.messageService.showMessage('Parâmetros inválidos. Verifique o link recebido por e-mail.');
    }
  }

  private initForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: CustomValidators.passwordMatch() });
  }

  private setupFormSubmittingHandler(): void {
    toObservable(this.isSubmitting, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isSubmitting => {
        if (isSubmitting) {
          this.resetPasswordForm.disable({ emitEvent: false });
        } else {
          this.resetPasswordForm.enable({ emitEvent: false });
        }
      });
  }
}