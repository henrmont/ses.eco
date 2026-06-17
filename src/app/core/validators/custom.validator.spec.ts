import { FormControl } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import { CustomValidators } from './custom.validator';

describe('CustomValidators', () => {

  describe('cpfValidator', () => {
    it('deve retornar null se o valor for vazio ou nulo (ignorar validação)', () => {
      const controlNull = new FormControl(null);
      const controlEmpty = new FormControl('');
      
      expect(CustomValidators.cpfValidator()(controlNull)).toBeNull();
      expect(CustomValidators.cpfValidator()(controlEmpty)).toBeNull();
    });

    it('deve retornar null para um CPF válido (com ou sem máscara)', () => {
      const controlComMascara = new FormControl('123.456.789-09');
      const controlSemMascara = new FormControl('12345678909');

      expect(CustomValidators.cpfValidator()(controlComMascara)).toBeNull();
      expect(CustomValidators.cpfValidator()(controlSemMascara)).toBeNull();
    });

    it('deve retornar { cpfInvalid: true } para um CPF com formato correto mas número inválido', () => {
      const controlIdentico = new FormControl('11111111111');
      const controlDVInvalido = new FormControl('12345678900');

      expect(CustomValidators.cpfValidator()(controlIdentico)).toEqual({ cpfInvalid: true });
      expect(CustomValidators.cpfValidator()(controlDVInvalido)).toEqual({ cpfInvalid: true });
    });

    it('deve retornar { documentInvalid: true } se a string limpa não tiver 11 caracteres', () => {
      const controlCurto = new FormControl('123456');
      const controlLongo = new FormControl('1234567890123');

      expect(CustomValidators.cpfValidator()(controlCurto)).toEqual({ documentInvalid: true });
      expect(CustomValidators.cpfValidator()(controlLongo)).toEqual({ documentInvalid: true });
    });
  });

  describe('cpfOrCnjValidator', () => {
    it('deve retornar null se o valor for nulo ou vazio', () => {
      const control = new FormControl(null);
      expect(CustomValidators.cpfOrCnjValidator()(control)).toBeNull();
    });

    it('deve validar CPF com sucesso quando o tamanho for 11', () => {
      const controlValido = new FormControl('12345678909');
      const controlInvalido = new FormControl('12345678900');

      expect(CustomValidators.cpfOrCnjValidator()(controlValido)).toBeNull();
      expect(CustomValidators.cpfOrCnjValidator()(controlInvalido)).toEqual({ cpfInvalid: true });
    });

    it('deve validar CNJ com sucesso quando o tamanho limpo for 32', () => {
      const cnjValido = '00000000000000000000000000000001'; 
      const cnjInvalido = '00000000000000000000000000000000';
      const cnjDVIncorreto = '12345678901234567890123456789099';

      const controlValido = new FormControl(cnjValido);
      const controlInvalido = new FormControl(cnjInvalido);
      const controlDVIncorreto = new FormControl(cnjDVIncorreto);

      expect(CustomValidators.cpfOrCnjValidator()(controlValido)).toBeNull();
      expect(CustomValidators.cpfOrCnjValidator()(controlInvalido)).toEqual({ cnjInvalid: true });
      expect(CustomValidators.cpfOrCnjValidator()(controlDVIncorreto)).toEqual({ cnjInvalid: true });
    });

    it('deve retornar { documentInvalid: true } se o tamanho não for nem 11 nem 32', () => {
      const control = new FormControl('1234567890');
      expect(CustomValidators.cpfOrCnjValidator()(control)).toEqual({ documentInvalid: true });
    });
  });

  describe('cnsValidator', () => {
    it('deve retornar null se o valor for nulo ou vazio', () => {
      const control = new FormControl('');
      expect(CustomValidators.cnsValidator()(control)).toBeNull();
    });

    it('deve retornar { documentInvalid: true } se não contiver 15 dígitos', () => {
      const control = new FormControl('12345');
      expect(CustomValidators.cnsValidator()(control)).toEqual({ documentInvalid: true });
    });

    it('deve retornar { cnsInvalid: true } se começar com um dígito inválido', () => {
      const control = new FormControl('323456789012345');
      expect(CustomValidators.cnsValidator()(control)).toEqual({ cnsInvalid: true });
    });

    // --- CNS Tipo 7, 8 ou 9 ---
    it('deve validar um CNS válido iniciado em 7, 8 ou 9', () => {
      // Cálculo exato para a sua fórmula: 7 * 15 = 105. Mais o último dígito 5 * 1 = 5.
      // Total da soma = 110. Módulo: 110 % 11 === 0. Retorna null (Válido).
      const cnsValido = '700000000000005'; 
      const control = new FormControl(cnsValido);
      expect(CustomValidators.cnsValidator()(control)).toBeNull();
    });

    it('deve invalidar um CNS iniciado em 7, 8 ou 9 se a soma módulo 11 falhar', () => {
      const cnsInvalido = '700000000000009'; 
      const control = new FormControl(cnsInvalido);
      expect(CustomValidators.cnsValidator()(control)).toEqual({ cnsInvalid: true });
    });

    // --- CNS Tipo 1 ou 2 (Baseado no PIS/PASEP) ---
    it('deve validar um CNS válido iniciado em 1 ou 2 onde DV padrão não é 10', () => {
      // PIS '10000000000'. Soma ponderada = 1 * 15 = 15. Resto = 15 % 11 = 4. 
      // DV = 11 - 4 = 7. Montagem final do seu código: PIS + '000' + '7' = '100000000000007'.
      const cnsValidoPIS = '100000000000007';
      const control = new FormControl(cnsValidoPIS);
      expect(CustomValidators.cnsValidator()(control)).toBeNull();
    });

    it('deve validar um CNS válido iniciado em 1 ou 2 tratada a exceção onde DV calculado é 10', () => {
      // Base PIS '10400000000' -> Soma = 67 -> Resto = 1 -> DV vira 10.
      // Soma Atualizada = 69 -> Resto Atualizado = 3 -> DV final calculado = 8.
      const cnsValidoExcecao = '104000000000018'; 
      const control = new FormControl(cnsValidoExcecao);
      expect(CustomValidators.cnsValidator()(control)).toBeNull();
    });

    it('deve invalidar um CNS iniciado em 1 ou 2 se o resultado final divergir do número informado', () => {
      const cnsInvalidoPIS = '100000000000009'; 
      const control = new FormControl(cnsInvalidoPIS);
      expect(CustomValidators.cnsValidator()(control)).toEqual({ cnsInvalid: true });
    });
  });

  describe('permissionsValidator', () => {
    it('deve retornar null se o valor for um array e possuir tamanho maior que o mínimo informado', () => {
      const control = new FormControl(['ADMIN', 'USER']);
      expect(CustomValidators.permissionsValidator()(control)).toBeNull();
    });

    it('deve retornar null respeitando o parâmetro dinâmico "min"', () => {
      const control = new FormControl(['ADMIN', 'USER', 'MANAGER']);
      expect(CustomValidators.permissionsValidator(2)(control)).toBeNull();
    });

    it('deve retornar { arrayMinLength: true } se o array não atingir o tamanho mínimo', () => {
      const controlVazio = new FormControl([]);
      const controlInsuficiente = new FormControl(['ADMIN']);

      expect(CustomValidators.permissionsValidator()(controlVazio)).toEqual({ arrayMinLength: true });
      expect(CustomValidators.permissionsValidator(2)(controlInsuficiente)).toEqual({ arrayMinLength: true });
    });

    it('deve retornar { arrayMinLength: true } se o valor inserido não for um array', () => {
      const controlString = new FormControl('Não sou um array');
      const controlObjeto = new FormControl({ perfil: 'ADMIN' });

      expect(CustomValidators.permissionsValidator()(controlString)).toEqual({ arrayMinLength: true });
      expect(CustomValidators.permissionsValidator()(controlObjeto)).toEqual({ arrayMinLength: true });
    });
  });

});