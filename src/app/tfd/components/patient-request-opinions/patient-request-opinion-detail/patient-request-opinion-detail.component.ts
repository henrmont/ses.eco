import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-patient-request-opinion-detail',
  standalone: true,
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule
  ],
  templateUrl: './patient-request-opinion-detail.component.html',
  styleUrl: './patient-request-opinion-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Máxima performance e controle com OnPush
})
export class PatientRequestOpinionDetailComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Signal derivado (computed) que limpa e sanitiza de forma reativa o conteúdo do parecer.
   * Elimina a necessidade de lógica no construtor antigo.
   */
  protected readonly sanitizedHtml = computed<SafeHtml>(() => {
    const rawHtml = this.data?.opinion?.content || '';
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });
}