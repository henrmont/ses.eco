import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MessageService } from './message-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MessageService', () => {
  let service: MessageService;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Cria um mock nativo do Vitest para as funções do MatSnackBar
    snackBarMock = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: MatSnackBar, useValue: snackBarMock } // Injeta o mock no lugar do SnackBar real
      ]
    });

    service = TestBed.inject(MessageService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve abrir o snackbar com as configurações padrão (showMessage)', () => {
    const mensagemTeste = 'Paciente salvo com sucesso!';
    
    service.showMessage(mensagemTeste);

    // Verifica se o método open do Vitest foi chamado com os parâmetros esperados
    expect(snackBarMock.open).toHaveBeenCalledWith(
      mensagemTeste,
      'Fechar', // Action padrão
      {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  });

  it('deve permitir sobrescrever as configurações padrão e a ação (showMessage)', () => {
    const mensagemTeste = 'Erro crítico!';
    const acaoCustomizada = 'Desfazer';
    const configCustomizada: MatSnackBarConfig = {
      duration: 5000,
      panelClass: ['error-snackbar'],
      verticalPosition: 'bottom' // Sobrescrevendo o 'top' padrão
    };

    service.showMessage(mensagemTeste, acaoCustomizada, configCustomizada);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      mensagemTeste,
      acaoCustomizada,
      {
        duration: 5000,               // Mudou de 3000 para 5000
        horizontalPosition: 'center', // Manteve o padrão do serviço
        verticalPosition: 'bottom',     // Mudou de top para bottom
        panelClass: ['error-snackbar'] // Nova propriedade adicionada pelo config externo
      }
    );
  });
});