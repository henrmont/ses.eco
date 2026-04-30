import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { ERRORS } from '../../../consts/errors';
import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-opinion-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, NgxEditorModule, MatProgressSpinnerModule],
  templateUrl: './create-opinion-component.html',
  styleUrl: './create-opinion-component.scss',
})
export class CreateOpinionComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createOpinionForm: FormGroup
  editor!: Editor;
  toolbar: Toolbar = [
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

  constructor(
    private formBuilder: FormBuilder,
    private opinionService: OpinionService,
    private messageService: MessageService,
    private dialog: MatDialogRef<CreateOpinionComponent>,
  ) {
    this.createOpinionForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required]],
      is_approved: [false, [Validators.required]],
    });
    this.editor = new Editor();
  }

  wSubmit = signal<boolean>(false)
  onCreateOpinionSubmit() {
    this.wSubmit.set(true);
    this.opinionService.createOpinion(this.data.patient_request.id, this.createOpinionForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialog.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false);
      },
    })
  }

}
