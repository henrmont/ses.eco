import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

export class CustomValidators {

  static cpfOrCnjValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.replace(/\D/g, '');
      if (!value) return null;

      if (value.length === 11) {
        return CustomValidators.validateCPF(value) ? null : { cpfInvalid: true };
      }

      if (value.length === 32) {
        return CustomValidators.validateCNJ(value) ? null : { cnjInvalid: true };
      }

      return { documentInvalid: true };
    };
  }

  static cnsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.replace(/\D/g, '');
      if (!value) return null;

      if (value.length === 15) {
        return CustomValidators.validateCNS(value) ? null : { cnsInvalid: true };
      }

      return { documentInvalid: true };
    };
  }

  static cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.replace(/\D/g, '');
      if (!value) return null;

      if (value.length === 11) {
        return CustomValidators.validateCPF(value) ? null : { cpfInvalid: true };
      }

      return { documentInvalid: true };
    };
  }

  static permissionsValidator(min: number = 0): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (Array.isArray(value) && value.length > min) {
        return null;
      }

      return { arrayMinLength: true };
    };
  }

  static dateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const parsed = CustomValidators.parseToMoment(value);
      return parsed && parsed.isValid() ? null : { invalidDate: true };
    };
  }

  static birthDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const parsed = CustomValidators.parseToMoment(value);
      if (!parsed || !parsed.isValid()) return { invalidDate: true };

      if (parsed.isAfter(moment())) {
        return { futureDate: true };
      }
      return null;
    };
  }

  /**
   * Valida se a data do controle é ANTERIOR ou IGUAL a uma data de referência.
   * @param target Valor direto da data, função getter, Signal OU nome do controle no FormGroup.
   */
  static dateBeforeValidator(target: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      let referenceValue: any;

      // Se for string e houver parent, tenta pegar o valor do controle informado
      if (typeof target === 'string' && control.parent) {
        const targetControl = control.parent.get(target);
        referenceValue = targetControl ? targetControl.value : target;
      } else if (typeof target === 'function') {
        // Suporta funções/signals: target()
        referenceValue = target();
      } else {
        referenceValue = target;
      }

      if (!referenceValue) {
        return null;
      }

      const inputDate = moment(control.value);
      const targetDate = moment(referenceValue);

      if (inputDate.isValid() && targetDate.isValid() && inputDate.isAfter(targetDate, 'day')) {
        return { dateBefore: true };
      }

      return null;
    };
  }

  /**
   * Valida se a data do controle é POSTERIOR ou IGUAL a uma data de referência.
   * @param target Valor direto da data, função getter, Signal OU nome do controle no FormGroup.
   */
  static dateAfterValidator(target: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      let referenceValue: any;

      // Se for string e houver parent, tenta pegar o valor do controle informado
      if (typeof target === 'string' && control.parent) {
        const targetControl = control.parent.get(target);
        referenceValue = targetControl ? targetControl.value : target;
      } else if (typeof target === 'function') {
        // Suporta funções/signals: target()
        referenceValue = target();
      } else {
        referenceValue = target;
      }

      if (!referenceValue) {
        return null;
      }

      const inputDate = moment(control.value);
      const targetDate = moment(referenceValue);

      if (inputDate.isValid() && targetDate.isValid() && inputDate.isBefore(targetDate, 'day')) {
        return { dateAfter: true };
      }

      return null;
    };
  }

  // --- MÉTODOS AUXILIARES PRIVADOS ---

  /**
   * Converte qualquer formato de data recebido (inclusive "YYYY-MM-DD HH:mm:ss")
   * para um objeto Moment e zera a hora para comparação exata de dia.
   */
  private static parseToMoment(value: any): _moment.Moment | null {
    if (!value) return null;
    if (moment.isMoment(value)) return value.clone().startOf('day');
    if (value instanceof Date) return moment(value).startOf('day');

    // Lista de formatos aceitos (incluindo o espaço com hora)
    const formats = [
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'YYYY-MM-DDTHH:mm:ss'
    ];

    // Tenta fazer o parse estrito com a lista de formatos
    let parsed = moment(value, formats, true);

    // Se falhar no estrito, tenta o parse legados/ISO como fallback
    if (!parsed.isValid()) {
      parsed = moment(value);
    }

    // Normaliza para o início do dia (00:00:00) para ignorar diferenças de horário
    return parsed.isValid() ? parsed.startOf('day') : null;
  }

  private static validateCNS(cns: string): boolean {
    if (!['1', '2', '7', '8', '9'].includes(cns[0])) return false;

    if (['7', '8', '9'].includes(cns[0])) {
      let soma = 0;
      for (let i = 0; i < 15; i++) {
        soma += parseInt(cns[i]) * (15 - i);
      }
      if (soma % 11 !== 0) return false;
    } 
    else if (['1', '2'].includes(cns[0])) {
      const pis = cns.substring(0, 11);
      let soma = 0;
      for (let i = 0; i < 11; i++) {
        soma += parseInt(pis[i]) * (15 - i);
      }

      const resto = soma % 11;
      let dv = 11 - resto;
      if (dv === 11) dv = 0;

      let resultado = "";
      if (dv === 10) {
        const somaAtualizada = soma + 2;
        const restoAtualizado = somaAtualizada % 11;
        dv = 11 - restoAtualizado;
        resultado = pis + "001" + dv.toString();
      } else {
        resultado = pis + "000" + dv.toString();
      }

      if (cns !== resultado) return false;
    } else {
      return false;
    }

    return true;
  }

  private static validateCPF(cpf: string): boolean {
    if (/^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;

    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  private static validateCNJ(cnj: string): boolean {
    if (/^(\d)\1+$/.test(cnj)) return false;

    const corpo = cnj.substring(0, 30);
    const dvInformado = cnj.substring(30, 32);

    let soma = 0;
    let peso = 2;

    for (let i = corpo.length - 1; i >= 0; i--) {
      soma += parseInt(corpo.charAt(i)) * peso;
      peso = (peso === 11) ? 2 : peso + 1;
    }

    let resto = soma % 11;
    let dvCalculado = 11 - resto;

    if (dvCalculado === 10 || dvCalculado === 11) {
      dvCalculado = 1;
    }

    const dvFormatado = dvCalculado.toString().padStart(2, '0');

    return dvFormatado === dvInformado;
  }
}