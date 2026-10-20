import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

export class CustomValidators {

  /**
   * Valida se o campo 'password' e o campo de confirmação ('password_confirmation' por padrão) possuem valores idênticos.
   * Pode ser aplicado tanto no FormGroup quanto diretamente em um controle.
   *
   * @param confirmationFieldName Nome do campo de confirmação (default: 'password_confirmation')
   * @param passwordFieldName Nome do campo de senha (default: 'password')
   */
  static passwordMatch(
    confirmationFieldName: string = 'password_confirmation',
    passwordFieldName: string = 'password'
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // 1. Aplicação em nível de FormGroup
      if (control.get(passwordFieldName) || control.get(confirmationFieldName)) {
        const passwordControl = control.get(passwordFieldName);
        const confirmControl = control.get(confirmationFieldName);

        if (!passwordControl || !confirmControl) return null;

        if (passwordControl.value !== confirmControl.value) {
          confirmControl.setErrors({ ...confirmControl.errors, passwordMismatch: true });
          return { passwordMismatch: true };
        }

        if (confirmControl.hasError('passwordMismatch')) {
          const errors = { ...confirmControl.errors };
          delete errors['passwordMismatch'];
          confirmControl.setErrors(Object.keys(errors).length ? errors : null);
        }

        return null;
      }

      // 2. Aplicação em nível de AbstractControl com acesso ao parent
      if (control.parent) {
        const passwordControl = control.parent.get(passwordFieldName);
        if (!passwordControl) return null;

        if (passwordControl.value !== control.value) {
          return { passwordMismatch: true };
        }
      }

      return null;
    };
  }

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
   * 
   * @param target Valor direto da data, função getter, Signal OU nome do controle no FormGroup.
   */
  static dateBeforeValidator(target: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      let referenceValue: any;

      if (typeof target === 'string' && control.parent) {
        const targetControl = control.parent.get(target);
        referenceValue = targetControl ? targetControl.value : target;
      } else if (typeof target === 'function') {
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
   * 
   * @param target Valor direto da data, função getter, Signal OU nome do controle no FormGroup.
   */
  static dateAfterValidator(target: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      let referenceValue: any;

      if (typeof target === 'string' && control.parent) {
        const targetControl = control.parent.get(target);
        referenceValue = targetControl ? targetControl.value : target;
      } else if (typeof target === 'function') {
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

  private static parseToMoment(value: any): _moment.Moment | null {
    if (!value) return null;
    if (moment.isMoment(value)) return value.clone().startOf('day');
    if (value instanceof Date) return moment(value).startOf('day');

    const formats = [
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'YYYY-MM-DDTHH:mm:ss'
    ];

    let parsed = moment(value, formats, true);

    if (!parsed.isValid()) {
      parsed = moment(value);
    }

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