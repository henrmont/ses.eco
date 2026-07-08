export const ERRORS = {
  email: [
    {type: 'required', message: 'O email é obrigatório.'},
    {type: 'email', message: 'O email tem que ser válido.'},
    {type: 'emailExists', message: 'Email já cadastrado.'},
  ],
  name: [
    {type: 'required', message: 'O nome é obrigatório.'},
  ],
  cnes: [
    {type: 'required', message: 'O CNES é obrigatório.'},
  ],
  type: [
    {type: 'required', message: 'O tipo é obrigatório.'},
  ],
  cns: [
    {type: 'required', message: 'O CNS é obrigatório.'},
    {type: 'documentInvalid', message: 'CNS inválido.'},
    {type: 'cnsInvalid', message: 'CNS inválido.'},
    {type: 'cnsExists', message: 'CNS já cadastrado.'},
    {type: 'cnsPatientExists', message: 'CNS já cadastrado no paciente.'},
  ],
  registration: [
    {type: 'required', message: 'A matrícula é obrigatória.'},
  ],
  document_type: [
    {type: 'required', message: 'O tipo de documento é obrigatório.'},
  ],
  document: [
    {type: 'required', message: 'O documento é obrigatório.'},
    {type: 'documentInvalid', message: 'Documento inválido.'},
    {type: 'cpfInvalid', message: 'CPF inválido.'},
    {type: 'cnjInvalid', message: 'CNJ inválido.'},
    {type: 'documentExists', message: 'Documento já cadastrado.'},
    {type: 'documentPatientExists', message: 'Documento já cadastrado no paciente.'},
  ],
  sigadoc: [
    {type: 'required', message: 'O Sigadoc é obrigatório.'},
  ],
  birth_date: [
    {type: 'required', message: 'A data de nascimento é obrigatória.'},
  ],
  gender: [
    {type: 'required', message: 'O gênero é obrigatório.'},
  ],
  race: [
    {type: 'required', message: 'A raça é obrigatória.'},
  ],
  naturalness: [
    {type: 'required', message: 'A naturalidade é obrigatória.'},
  ],
  cep: [
    {type: 'required', message: 'O CEP é obrigatório.'},
    {type: 'pattern', message: 'CEP deve conter 7 dígitos.'},
  ],
  address: [
    {type: 'required', message: 'O endereço é obrigatório.'},
  ],
  number: [
    {type: 'required', message: 'O número é obrigatório.'},
  ],
  neighborhood: [
    {type: 'required', message: 'O bairro é obrigatório.'},
  ],
  protocol: [
    {type: 'required', message: 'O protocolo é obrigatório.'},
  ],
  diagnosis: [
    {type: 'required', message: 'O diagnóstico é obrigatório.'},
  ],
  patient: [
    {type: 'required', message: 'O paciente é obrigatório.'},
  ],
  cid: [
    {type: 'required', message: 'O CID é obrigatório.'},
  ],
  medical_professional: [
    {type: 'required', message: 'O profissional de saúde é obrigatório.'},
  ],
  consultation_date: [
    {type: 'required', message: 'A data da consulta é obrigatória.'},
  ],
  travel_professional: [
    {type: 'required', message: 'O profissional de transporte é obrigatório.'},
  ],
  cost_assistance_professional: [
    {type: 'required', message: 'O profissional de ajuda de custo é obrigatório.'},
  ],
  observation: [
    {type: 'required', message: 'A observação é obrigatória.'},
  ],
  to: [
    {type: 'required', message: 'O destinatário é obrigatório.'},
  ],
  reason: [
    {type: 'required', message: 'A justificativa é obrigatória.'},
  ],
  social_professional: [
    {type: 'required', message: 'O assistente social é obrigatório.'},
  ],
  hospital_unity: [
    {type: 'required', message: 'A unidade hospitalar é obrigatória.'},
  ],
  service_order: [
    {type: 'required', message: 'A ordem de serviço é obrigatória.'},
  ],
  passenger: [
    {type: 'required', message: 'O passageiro é obrigatório.'},
  ],
  tariff: [
    {type: 'required', message: 'A tarifa é obrigatória.'},
  ],
  tax: [
    {type: 'required', message: 'A taxa é obrigatória.'},
  ],
  origin: [
    {type: 'required', message: 'A origem é obrigatória.'},
  ],
  destination: [
    {type: 'required', message: 'O destino é obrigatório.'},
  ],
  daily_cost_id: [
    {type: 'required', message: 'O tipo de diária é obrigatório.'},
  ],
  amount: [
    {type: 'required', message: 'A quantidade é obrigatória.'},
  ],
  payment_professional: [
    {type: 'required', message: 'O profissional de pagamento é obrigatório.'},
  ],
}
