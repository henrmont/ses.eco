import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PaymentInfoComponent } from './payment-info-component';
import { PaymentService } from '../../../services/payment-service';
import { MessageService } from '../../../../core/services/message-service';

describe('PaymentInfoComponent', () => {
  let component: PaymentInfoComponent;
  let fixture: ComponentFixture<PaymentInfoComponent>;

  let paymentServiceMock: any;
  let messageServiceMock: any;
  let dialogRefMock: any;

  const mockDialogData = {
    patient_request: {
      id: 550,
      payment_info: {
        description: 'Informações de pagamento iniciais do banco'
      }
    }
  };

  beforeEach(async () => {
    paymentServiceMock = {
      paymentInfo: vi.fn()
    };

    messageServiceMock = {
      showMessage: vi.fn()
    };

    dialogRefMock = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        PaymentInfoComponent
      ],
      providers: [
        provideAnimationsAsync('noop'),
        { provide: PaymentService, useValue: paymentServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    })
    .overrideComponent(PaymentInfoComponent, {
      set: {
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentInfoComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente com sucesso e inicializar o formulário com as informações existentes', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component['isSubmitting']()).toBe(false);
    expect(component['paymentInfoForm']).toBeTruthy();
    
    expect(component['paymentInfoForm'].get('old')?.value).toBe('Informações de pagamento iniciais do banco');
    expect(component['paymentInfoForm'].get('description')?.value).toBe('Informações de pagamento iniciais do banco');
  });

  describe('Fluxo de Submissão do Formulário de Informações de Pagamento (onSubmit)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      
      // 🛡️ Garante que o objeto data seja resetado para o estado íntegro original antes de cada teste
      (component as any).data = {
        patient_request: {
          id: 550,
          payment_info: {
            description: 'Informações de pagamento iniciais do banco'
          }
        }
      };
    });

    it('deve ignorar chamadas subsequentes ao onSubmit se isSubmitting já for verdadeiro (proteção contra duplo clique)', () => {
      component['paymentInfoForm'].patchValue({
        description: 'Nova descrição editada'
      });

      // Força o estado de submissão ativo
      component['isSubmitting'].set(true);

      component['onSubmit']();

      // Garante que o serviço NÃO foi chamado porque a proteção de gatekeeper barrou o fluxo
      expect(paymentServiceMock.paymentInfo).not.toHaveBeenCalled();
    });

    it('deve barrar a submissão e marcar campos como tocados se o formulário estiver inválido (campos requeridos em branco)', () => {
      component['paymentInfoForm'].patchValue({
        description: null // Força a invalidação do campo requerido
      });
      expect(component['paymentInfoForm'].invalid).toBe(true);

      component['onSubmit']();

      expect(paymentServiceMock.paymentInfo).not.toHaveBeenCalled();
      expect(component['isSubmitting']()).toBe(false);
    });

    it('deve barrar a submissão se o ID da solicitação do paciente não existir nos dados da modal', () => {
      // Modifica o estado do dado local com segurança para simular falha na checagem
      (component as any).data = { patient_request: null };
      component['paymentInfoForm'].patchValue({ description: 'Nova descrição válida' });
      
      component['onSubmit']();

      expect(paymentServiceMock.paymentInfo).not.toHaveBeenCalled();
    });

    it('deve salvar as informações de pagamento com sucesso utilizando getRawValue, exibir mensagem e fechar a modal', () => {
      component['paymentInfoForm'].patchValue({
        description: 'Dados bancários: Agência 1234 Conta 56789-0'
      });

      paymentServiceMock.paymentInfo.mockReturnValue(of({ message: 'Informações de pagamento salvas com sucesso!' }));

      component['onSubmit']();

      expect(component['isSubmitting']()).toBe(false);
      expect(paymentServiceMock.paymentInfo).toHaveBeenCalledWith(550, {
        old: 'Informações de pagamento iniciais do banco',
        description: 'Dados bancários: Agência 1234 Conta 56789-0'
      });
      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Informações de pagamento salvas com sucesso!');
      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('deve usar mensagem padrão se o servidor responder com sucesso mas sem corpo de mensagem', () => {
      component['paymentInfoForm'].patchValue({
        description: 'Dados atualizados'
      });
      paymentServiceMock.paymentInfo.mockReturnValue(of({}));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Informações de pagamento salvas com sucesso!');
    });

    it('deve tratar e expor erros amigáveis retornados pela API do servidor se o backend falhar', () => {
      component['paymentInfoForm'].patchValue({
        description: 'Descrição sob auditoria'
      });

      const mockApiError = { error: { message: 'Não é possível alterar informações de uma solicitação com lote pago.' } };
      paymentServiceMock.paymentInfo.mockReturnValue(throwError(() => mockApiError));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Não é possível alterar informações de uma solicitação com lote pago.');
      expect(dialogRefMock.close).not.toHaveBeenCalled();
      expect(component['isSubmitting']()).toBe(false);
    });

    it('deve acionar a string de fallback padrão quando o servidor retornar um error genérico sem mensagem explícita', () => {
      component['paymentInfoForm'].patchValue({
        description: 'Erro crítico de banco'
      });

      const mockRawError = { status: 500, statusText: 'Internal Server Error' };
      paymentServiceMock.paymentInfo.mockReturnValue(throwError(() => mockRawError));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Ocorreu um erro ao salvar as informações de pagamento.');
      expect(dialogRefMock.close).not.toHaveBeenCalled();
      expect(component['isSubmitting']()).toBe(false);
    });
  });
});