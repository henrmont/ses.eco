import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {

  static cpfOrCnjValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.replace(/\D/g, '');
      if (!value) return null;

      if (value.length === 11) {
        return this.validateCPF(value) ? null : { cpfInvalid: true };
      }

      if (value.length === 32) {
        return this.validateCNJ(value) ? null : { cnjInvalid: true };
      }

      return { documentInvalid: true };
    };
  }

  static cnsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.replace(/\D/g, '');
      if (!value) return null;

      if (value.length === 15) {
        return this.validateCNS(value) ? null : { cnsInvalid: true };
      }

      return { documentInvalid: true };
    };
  }

  static cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.replace(/\D/g, '');
      if (!value) return null;

      if (value.length === 11) {
        return this.validateCPF(value) ? null : { cpfInvalid: true };
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
      
      // Para ser válido, o resto da divisão por 11 deve ser zero
      if (soma % 11 !== 0) {
        return false;
      }
    } 
    // Regra para CNS iniciado em 1 ou 2 (PIS/PASEP)
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
      // Se não começar com 1, 2, 7, 8 ou 9, é inválido
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

  /**
   * Validação de Matrícula CNJ (Provimento nº 3/2009)
   * A regra utiliza Módulo 11 com pesos de 2 a 11, da direita para a esquerda.
   */
  private static validateCNJ(cnj: string): boolean {
    // A matrícula não pode ser composta por números todos iguais
    if (/^(\d)\1+$/.test(cnj)) return false;

    const corpo = cnj.substring(0, 30);
    const dvInformado = cnj.substring(30, 32);

    let soma = 0;
    let peso = 2;

    // Multiplica da direita para a esquerda, reiniciando o peso em 11
    for (let i = corpo.length - 1; i >= 0; i--) {
      soma += parseInt(corpo.charAt(i)) * peso;
      peso = (peso === 11) ? 2 : peso + 1;
    }

    let resto = soma % 11;
    let dvCalculado = 11 - resto;

    // Se o resultado for 10 ou 11, o DV é 1
    if (dvCalculado === 10 || dvCalculado === 11) {
      dvCalculado = 1;
    }

    // O CNJ usa dois dígitos, mas o cálculo do provimento gera um valor que 
    // deve ser comparado com o número formado pelos dois últimos dígitos.
    // Se o cálculo resultar em 1 dígito (ex: 7), ele é comparado como "07".
    const dvFormatado = dvCalculado.toString().padStart(2, '0');

    return dvFormatado === dvInformado;
  }

}

