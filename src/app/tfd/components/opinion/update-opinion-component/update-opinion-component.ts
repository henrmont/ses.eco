import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';
import { ERRORS } from '../../../consts/errors';

@Component({
  selector: 'app-update-opinion-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, NgxEditorModule, MatProgressSpinnerModule],
  templateUrl: './update-opinion-component.html',
  styleUrl: './update-opinion-component.scss',
})
export class UpdateOpinionComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updateOpinionForm: FormGroup
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
    private dialog: MatDialogRef<UpdateOpinionComponent>,
  ) {
    this.updateOpinionForm = this.formBuilder.group({
      name: [this.data.opinion.name, [Validators.required]],
      content: [this.data.opinion.content, [Validators.required]],
      is_approved: [this.data.opinion.is_approved, [Validators.required]],
    });
    this.editor = new Editor();
  }

  wSubmit = signal<boolean>(false)
  onUpdateOpinionSubmit() {
    this.wSubmit.set(true);
    this.opinionService.updateOpinion(this.data.opinion.id, this.updateOpinionForm.value).subscribe({
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
