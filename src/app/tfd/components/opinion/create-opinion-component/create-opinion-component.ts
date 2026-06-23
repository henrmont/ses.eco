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
  selector: 'app-create-opinion-component',
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
  templateUrl: './create-opinion-component.html',
  styleUrl: './create-opinion-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush
})
export class CreateOpinionComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateOpinionComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário e Editor
  protected createOpinionForm!: FormGroup;
  protected editor!: Editor;
  
  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro (Idêntico ao padrão de referência)
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

  ngOnInit(): void {
    this.initForm();
    this.initEditor();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO ---

  private initForm(): void {
    this.createOpinionForm = this.fb.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required]],
      is_approved: [false, [Validators.required]],
    });
  }

  private initEditor(): void {
    this.editor = new Editor();

    // Liberação segura de memória para evitar vazamento com o ciclo do editor do Rich Text
    this.destroyRef.onDestroy(() => {
      this.editor.destroy();
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (this.createOpinionForm.invalid || !requestId) {
      this.createOpinionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.opinionService.createOpinion(requestId, this.createOpinionForm.value)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Parecer criado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a criação do parecer.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}