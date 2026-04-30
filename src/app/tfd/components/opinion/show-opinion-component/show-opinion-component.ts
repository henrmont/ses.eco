import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-show-opinion-component',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './show-opinion-component.html',
  styleUrl: './show-opinion-component.scss',
})
export class ShowOpinionComponent {

  data = inject(MAT_DIALOG_DATA)
  sanitizedHtml!: SafeHtml;

  constructor(
    private sanitizer: DomSanitizer
  ) {
    this.sanitizedHtml = this.sanitizeHtml(this.data.opinion.content);
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}
