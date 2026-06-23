import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-opinion-component',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSlideToggleModule, 
    NgxEditorModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './update-opinion-component.html',
  styleUrl: './update-opinion-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush
})
export class UpdateOpinionComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateOpinionComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário e Editor expostos ao template
  protected updateOpinionForm!: FormGroup;
  protected editor!: Editor;
  
  // Estados reativos controlados via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro embutidas
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O título ou nome do parecer é obrigatório.' }
    ],
    content: [
      { type: 'required', message: 'A descrição ou conteúdo do parecer é obrigatório.' }
    ],
    is_approved: [
      { type: 'required', message: 'A definição do status de aprovação é obrigatória.' }
    ]
  };

  protected readonly toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
    ['superscript', 'subscript'],
    ['undo', 'redo'],
  ];

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.initEditor();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    // Inicializa os controles mapeando de forma segura as propriedades passadas via modal data
    this.updateOpinionForm = this.fb.group({
      name: [this.data?.opinion?.name ?? null, [Validators.required]],
      content: [this.data?.opinion?.content ?? null, [Validators.required]],
      is_approved: [this.data?.opinion?.is_approved ?? false, [Validators.required]],
    });
  }

  private initEditor(): void {
    this.editor = new Editor();

    // Garante a liberação de memória em caso de destruição do componente
    this.destroyRef.onDestroy(() => {
      this.editor.destroy();
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const opinionId = this.data?.opinion?.id;

    if (this.updateOpinionForm.invalid || !opinionId) {
      this.updateOpinionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.opinionService.updateOpinion(opinionId, this.updateOpinionForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Parecer atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao processar a atualização do parecer.';
          this.messageService.showMessage(errMsg);
        },
      });
  }
}