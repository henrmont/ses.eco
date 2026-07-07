import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FinishPatientRequestAccountabilityComponent } from './finish-patient-request-accountability-component';
import { AccountabilityService } from '../../../services/accountability-service';
import { MessageService } from '../../../../core/services/message-service';

describe('FinishPatientRequestAccountabilityComponent', () => {
  let component: FinishPatientRequestAccountabilityComponent;
  let fixture: ComponentFixture<FinishPatientRequestAccountabilityComponent>;
  
  let accountabilityServiceMock: any;
  let messageServiceMock: any;
  let dialogRefMock: any;

  // Mock estruturado exatamente igual ao HTML do fluxo de Prestação de Contas
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
    accountabilityServiceMock = {
      finishPatientRequestAccountability: vi.fn()
    };

    messageServiceMock = {
      showMessage: vi.fn()
    };

    dialogRefMock = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [FinishPatientRequestAccountabilityComponent]
    })
    .overrideComponent(FinishPatientRequestAccountabilityComponent, {
      set: {
        providers: [
          { provide: AccountabilityService, useValue: accountabilityServiceMock },
          { provide: MessageService, useValue: messageServiceMock },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinishPatientRequestAccountabilityComponent);
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
      TestBed.configureTestingModule({ imports: [FinishPatientRequestAccountabilityComponent] })
        .overrideComponent(FinishPatientRequestAccountabilityComponent, {
          set: {
            providers: [
              { provide: AccountabilityService, useValue: accountabilityServiceMock },
              { provide: MessageService, useValue: messageServiceMock },
              { provide: MatDialogRef, useValue: dialogRefMock },
              { provide: MAT_DIALOG_DATA, useValue: { patient_request: { id: null, report: { patient_care: { patient: { name: 'Incompleto' } } } } } }
            ]
          }
        });

      const localFixture = TestBed.createComponent(FinishPatientRequestAccountabilityComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Erro: Identificador da solicitação não encontrado.');
      expect(accountabilityServiceMock.finishPatientRequestAccountability).not.toHaveBeenCalled();
    });

    it('deve finalizar a prestação de contas com sucesso, exibir toast e fechar a modal retornando true', () => {
      fixture.detectChanges();
      const mockApiResponse = { message: 'Prestação de contas finalizada com sucesso!' };
      accountabilityServiceMock.finishPatientRequestAccountability.mockReturnValue(of(mockApiResponse));

      component['onSubmit']();

      expect(accountabilityServiceMock.finishPatientRequestAccountability).toHaveBeenCalledWith(740);
      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Prestação de contas finalizada com sucesso!');
      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('deve usar mensagem padrão de sucesso se a API retornar um objeto vazio', () => {
      fixture.detectChanges();
      accountabilityServiceMock.finishPatientRequestAccountability.mockReturnValue(of({}));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Prestação de contas finalizada com sucesso!');
    });

    it('deve tratar falhas do servidor, exibir mensagem de erro da API e resetar o estado de carregamento do botão', () => {
      fixture.detectChanges();
      const mockApiError = { error: { message: 'Esta prestação de contas já foi encerrada.' } };
      accountabilityServiceMock.finishPatientRequestAccountability.mockReturnValue(throwError(() => mockApiError));

      component['onSubmit']();

      expect(accountabilityServiceMock.finishPatientRequestAccountability).toHaveBeenCalledWith(740);
      expect(messageServiceMock.showMessage).toHaveBeenCalledWith(mockApiError.error.message);
      expect(component['isSubmitting']()).toBe(false);
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('deve usar mensagem de erro genérica se o servidor falhar sem retornar corpo de erro', () => {
      fixture.detectChanges();
      const rawError = { status: 500 };
      accountabilityServiceMock.finishPatientRequestAccountability.mockReturnValue(throwError(() => rawError));

      component['onSubmit']();

      expect(messageServiceMock.showMessage).toHaveBeenCalledWith('Ocorreu um erro ao tentar finalizar a prestação de contas.');
      expect(component['isSubmitting']()).toBe(false);
    });
  });
});