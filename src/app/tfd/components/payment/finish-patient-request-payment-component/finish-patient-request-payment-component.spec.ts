import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FinishPatientRequestPaymentComponent } from './finish-patient-request-payment-component';
import { PaymentService } from '../../../services/payment-service';
import { MessageService } from '../../../../core/services/message-service';

describe('FinishPatientRequestPaymentComponent', () => {
  let component: FinishPatientRequestPaymentComponent;
  let fixture: ComponentFixture<FinishPatientRequestPaymentComponent>;
  
  let paymentServiceMock: any;
  let messageServiceMock: any;
  let dialogRefMock: any;

  // Mock estruturado exatamente igual ao HTML do fluxo de Pagamentos
  const mockDialogData = {
    patient_request: {
      id: 740,
      report: {
        patient_care: {
          patient: {
            name: 'Maria Oliveira'
          }
        }
      }
    }
  };

  beforeEach(async () => {
    paymentServiceMock = {
      finishPatientRequestPayment: vi.fn()
    };

    messageServiceMock = {
      showMessage: vi.fn()
    };

    dialogRefMock = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [FinishPatientRequestPaymentComponent]
    })
    .overrideComponent(FinishPatientRequestPaymentComponent, {
      set: {
        providers: [
          { provide: PaymentService, useValue: paymentServiceMock },
          { provide: MessageService, useValue: messageServiceMock },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinishPatientRequestPaymentComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve instanciar o componente com sucesso', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('deve inicializar com o estado de submissão desativado', () => {
      fixture.detectChanges();
      expect(component['isSubmitting']()).toBe(false);
    });
  });

  describe('Fluxo de Submissão (onSubmit)', () => {
    it('deve barrar a execução e exibir mensagem de erro se o id da solicitação não estiver presente', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [FinishPatientRequestPaymentComponent] })
        .overrideComponent(FinishPatientRequestPaymentComponent, {
          set: {
            providers: [
              { provide: PaymentService, useValue: paymentServiceMock },
              { provide: MessageService, useValue: messageServiceMock },
              { provide: MatDialogRef, useValue: dialogRefMock },
              { provide: MAT_DIALOG_DATA, useValue: { patient_request: { id: null, report: { patient_care: { patient: { name: 'Incompleto' } } } } } }
            ]
          }
        });

      const localFixture = TestBed.createComponent(FinishPatientRequestPaymentComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Erro: Identificador da solicitação não encontrado.');
      expect(paymentServiceMock.finishPatientRequestPayment).not.toHaveBeenCalled();
    });

    it('deve finalizar o pagamento com sucesso, exibir toast e fechar a modal retornando true', () => {
      fixture.detectChanges();
      const mockApiResponse = { message: 'Fluxo de pagamento finalizado com sucesso!' };
      paymentServiceMock.finishPatientRequestPayment.mockReturnValue(of(mockApiResponse));

      component['onSubmit']();

      expect(paymentServiceMock.finishPatientRequestPayment).toHaveBeenCalledWith(740);
      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Fluxo de pagamento finalizado com sucesso!');
      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('deve usar mensagem padrão de sucesso se a API retornar um objeto vazio', () => {
      fixture.detectChanges();
      paymentServiceMock.finishPatientRequestPayment.mockReturnValue(of({}));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Fluxo de pagamento finalizado com sucesso!');
    });

    it('deve tratar falhas do servidor, exibir mensagem de erro da API e resetar o estado de carregamento do botão', () => {
      fixture.detectChanges();
      const mockApiError = { error: { message: 'Este pagamento já foi encerrado e liquidado.' } };
      paymentServiceMock.finishPatientRequestPayment.mockReturnValue(throwError(() => mockApiError));

      component['onSubmit']();

      expect(paymentServiceMock.finishPatientRequestPayment).toHaveBeenCalledWith(740);
      expect(messageServiceMock.showMessage).toHaveBeenCalledWith(mockApiError.error.message);
      expect(component['isSubmitting']()).toBe(false);
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('deve usar mensagem de erro genérica se o servidor falhar sem retornar corpo de erro', () => {
      fixture.detectChanges();
      const rawError = { status: 500 };
      paymentServiceMock.finishPatientRequestPayment.mockReturnValue(throwError(() => rawError));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Ocorreu um erro ao tentar finalizar o pagamento.');
      expect(component['isSubmitting']()).toBe(false);
    });
  });
});