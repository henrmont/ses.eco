import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MessageService } from './message-service';

describe('MessageService', () => {
  let service: MessageService;
  let snackBarMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock simples da função open do MatSnackBar
    snackBarMock = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    });

    // Obtém a instância do serviço através do TestBed injector
    service = TestBed.inject(MessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deve chamar o MatSnackBar.open com a mensagem informada e as configurações padrão', () => {
    const mensagemDeTeste = 'Operação realizada com sucesso!';
    
    service.showMessage(mensagemDeTeste);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      mensagemDeTeste,
      'Fechar',
      {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  });

  it('deve permitir customizar o texto da ação do botão quando informado', () => {
    const mensagemDeTeste = 'Excluído!';
    const acaoCustomizada = 'Desfazer';

    service.showMessage(mensagemDeTeste, acaoCustomizada);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      mensagemDeTeste,
      acaoCustomizada,
      expect.any(Object) // Garante que enviou o objeto de configuração
    );
  });

  it('deve permitir sobrescrever as configurações padrão de posicionamento ou duração', () => {
    const configSobrescrevida = { duration: 5000, verticalPosition: 'bottom' as const };

    service.showMessage('Erro grave', 'Fechar', configSobrescrevida);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Erro grave',
      'Fechar',
      expect.objectContaining({
        duration: 5000,
        horizontalPosition: 'center', // Mantém o padrão não modificado
        verticalPosition: 'bottom'    // Aplicou a alteração
      })
    );
  });
});