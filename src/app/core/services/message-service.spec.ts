import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MessageService } from './message-service';

describe('MessageService (Vitest)', () => {
  let service: MessageService;
  let mockSnackBar: any;

  beforeEach(() => {
    // 🌟 Criação do spy focado na assinatura do método open do MatSnackBar
    mockSnackBar = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        MessageService,
        { provide: MatSnackBar, useValue: mockSnackBar } // Injeta o mock simulado
      ]
    });

    service = TestBed.inject(MessageService);
  });

  it('deve criar o serviço de mensagens com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve chamar o MatSnackBar.open com os parâmetros corretos de estilização e tempo', () => {
    const textoMensagem = 'Usuário atualizado com sucesso!';

    service.showMessage(textoMensagem);

    // Verifica se o método open foi invocado pelo serviço
    expect(mockSnackBar.open).toHaveBeenCalled();

    // 🌟 Validação profunda dos parâmetros e da configuração (duration, position)
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      textoMensagem,
      'Fechar',
      {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      }
    );
  });
});