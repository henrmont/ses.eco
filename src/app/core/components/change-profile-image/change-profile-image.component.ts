import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Bibliotecas Externas
import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from 'ngx-image-cropper';

// Core & Services
import { ApiResponse } from '../../models/api-response.model';
import { MessageService } from '../../services/message-service';
import { ProfileService } from '../../services/profile-service';

@Component({
  selector: 'app-change-profile-image',
  standalone: true,
  imports: [
    FormsModule,
    ImageCropperComponent,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './change-profile-image.component.html',
  styleUrl: './change-profile-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeProfileImageComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ChangeProfileImageComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly cdr = inject(ChangeDetectorRef); // Injetado para forçar a atualização da UI OnPush

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected changeProfileImageForm!: FormGroup;
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly imageChangedEvent = this.data?.event;

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.initForm();
    this.setupFormSubmittingHandler();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template (Protected)
  // ==========================================
  protected imageCropped(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.changeProfileImageForm.patchValue({
        image: event.base64
      });
      this.changeProfileImageForm.markAsDirty();
      this.cdr.markForCheck(); // Notifica o Angular OnPush que o formulário/estado mudou
    }
  }

  protected imageLoaded(image: LoadedImage): void {
    this.cdr.markForCheck();
  }

  protected cropperReady(): void {
    this.cdr.markForCheck();
  }

  protected loadImageFailed(): void {
    this.messageService.showMessage('Falha ao carregar a imagem selecionada.');
  }

  protected onSubmit(): void {
    if (this.changeProfileImageForm.invalid) {
      this.changeProfileImageForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.profileService.changeProfileImage(this.changeProfileImageForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Imagem do perfil atualizada com sucesso!');
          // Retorna o valor base64 da imagem salva para quem abriu o modal
          const newImageBase64 = this.changeProfileImageForm.get('image')?.value;
          this.dialogRef.close(newImageBase64);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar a imagem do perfil.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private initForm(): void {
    this.changeProfileImageForm = this.fb.group({
      id: [this.data?.user?.id || '', [Validators.required]],
      image: [null, [Validators.required]]
    });
  }

  private setupFormSubmittingHandler(): void {
    toObservable(this.isSubmitting, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isSubmitting => {
        if (isSubmitting) {
          this.changeProfileImageForm.disable({ emitEvent: false });
        } else {
          this.changeProfileImageForm.enable({ emitEvent: false });
        }
        this.cdr.markForCheck();
      });
  }
}