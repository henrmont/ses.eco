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

  private static validateCNS(cns: string): boolean {
    if (!['1', '2', '7', '8', '9'].includes(cns[0])) return false;

    if (['7', '8', '9'].includes(cns[0])) {
      let soma = 0;
      for (let i = 0; i < 15; i++) {
        soma += parseInt(cns[i]) * (15 - i);
      }
      
      if (soma % 11 !== 0) {
        return false;
      }
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

      if (cns !== resultado) {
        return false;
      }
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

  static dateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; // O validador 'required' trata campos vazios
      }

      // Se for um objeto do Moment
      if (moment.isMoment(value)) {
        if (!value.isValid()) {
          return { invalidDate: true };
        }
        return null;
      }

      // Se for uma string ou Date nativo, tenta converter e validar
      const parsed = moment(value, ['YYYY-MM-DD', 'DD/MM/YYYY'], true);
      if (!parsed.isValid()) {
        return { invalidDate: true };
      }
      return null;
    };
  }

  static birthDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; // O validador 'required' trata campos vazios
      }

      // Se for um objeto do Moment
      if (moment.isMoment(value)) {
        // Validação opcional: não permite datas no futuro
        if (value.isAfter(moment())) {
          return { futureDate: true };
        }
        return null;
      }

      // Se for uma string ou Date nativo, tenta converter e validar
      const parsed = moment(value, ['YYYY-MM-DD', 'DD/MM/YYYY'], true);
      if (parsed.isAfter(moment())) {
        return { futureDate: true };
      }
      return null;
    };
  }

}