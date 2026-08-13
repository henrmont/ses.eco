import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PatientRequestOpinionService } from '../../../services/patient-request-opinion.service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-patient-request-opinion-create',
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
  templateUrl: './patient-request-opinion-create.component.html',
  styleUrl: './patient-request-opinion-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestOpinionCreateComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestOpinionCreateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário e Editor
  protected opinionForm!: FormGroup;
  protected editor!: Editor;
  
  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro padronizado para a UI
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

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.opinionForm = this.fb.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required]],
      is_approved: [false, [Validators.required]],
    });
  }

  private initEditor(): void {
    this.editor = new Editor();

    // Liberação segura de memória para evitar vazamento com o ciclo do editor Rich Text
    this.destroyRef.onDestroy(() => {
      this.editor.destroy();
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Identificador da solicitação inválido.');
      return;
    }

    if (this.opinionForm.invalid) {
      this.opinionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // Sincroniza imediatamente o estado visual no DOM

    this.opinionService.createOpinion(requestId, this.opinionForm.value)
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
          const fallbackError = 'Ocorreu um erro ao processar a criação do parecer.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}