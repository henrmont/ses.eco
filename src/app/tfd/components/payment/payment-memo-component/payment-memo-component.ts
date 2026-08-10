import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment-service';

@Component({
  selector: 'app-payment-memo-component',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconButton,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './payment-memo-component.html',
  styleUrl: './payment-memo-component.scss',
})
export class PaymentMemoComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly paymentService = inject(PaymentService);

  private memoContent = viewChild<ElementRef<HTMLElement>>('memoContent');

  /**
   * Copia o conteúdo do memorando mantendo a formatação rica de tabela (HTML)
   * e um fallback legível em texto puro.
   */
  protected onCopyText(): void {
    const contentElement = this.memoContent()?.nativeElement;
    if (!contentElement) return;

    // 1. Clona o conteúdo para não afetar a interface
    const clone = contentElement.cloneNode(true) as HTMLElement;

    // 2. Remove o background de todos os elementos e garante fundo transparente/branco
    const allElements = clone.querySelectorAll<HTMLElement>('*');
    allElements.forEach((el) => {
      el.style.backgroundColor = 'transparent';
    });

    // 3. Aplica estilos inline para a tabela (com fundo limpo e bordas visíveis)
    const tables = clone.querySelectorAll('table');
    tables.forEach((table) => {
      table.setAttribute('style', 'border-collapse: collapse; width: 100%; border: 1px solid #000; background-color: transparent;');
    });

    const cells = clone.querySelectorAll('th, td');
    cells.forEach((cell) => {
      cell.setAttribute(
        'style',
        'border: 1px solid #000000; padding: 6px 10px; text-align: center; font-family: Arial, sans-serif; font-size: 11pt; background-color: transparent;'
      );
    });

    const headers = clone.querySelectorAll('th');
    headers.forEach((header) => {
      header.style.fontWeight = 'bold';
      header.style.backgroundColor = 'transparent';
    });

    // 4. Cria um container temporário fora da tela
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.appendChild(clone);
    document.body.appendChild(container);

    // 5. Seleciona e executa a cópia
    const range = document.createRange();
    range.selectNodeContents(container);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        navigator.clipboard.writeText(contentElement.innerText);
      }
    } catch (err) {
      console.error('Erro ao copiar tabela:', err);
      navigator.clipboard.writeText(contentElement.innerText);
    } finally {
      if (selection) {
        selection.removeAllRanges();
      }
      document.body.removeChild(container);
    }
  }

  protected downloadMemoPdf(): void {

    this.paymentService.downloadMemoPdf(this.data.payment.id)
      .subscribe({
        next: (blobData: Blob) => {
          // Instancia o Blob com o tipo application/pdf
          const file = new Blob([blobData], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);

          // Cria elemento <a> invisível para acionar a janela de download do navegador
          const anchor = document.createElement('a');
          anchor.href = fileURL;
          anchor.download = `memorando_${this.data.payment.document_number}.pdf`;
          anchor.click();

          // Desaloca a URL temporária da memória
          URL.revokeObjectURL(fileURL);
        },
        error: (err) => {
          console.error('Erro ao realizar o download do arquivo mesclado:', err);
        }
      });
  }
}