import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  // 🔒 Injeção de dependência moderna e limpa
  private readonly snackBar = inject(MatSnackBar);

  // ⚙️ Configuração padrão centralizada para manter a consistência visual
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
  };

  /**
   * Exibe uma mensagem rápida (Toast) na tela para o usuário.
   * @param message Texto a ser exibido
   * @param action Texto do botão de ação (padrão: 'Fechar')
   * @param config Configurações adicionais customizadas do SnackBar
   */
  showMessage(message: string, action: string = 'Fechar', config?: MatSnackBarConfig): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      ...config, // Permite sobrescrever configurações específicas se necessário
    });
  }
}