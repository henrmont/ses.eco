import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { map, Observable, startWith, finalize } from 'rxjs';

import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-update-patient-report-component',
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatSlideToggleModule, 
    MatTooltipModule, 
    MatAutocompleteModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './update-patient-report-component.html',
  styleUrl: './update-patient-report-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientReportComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientReportComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Mapeamento local das mensagens de erro (protected) embutidas no componente
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    protocol: [
      { type: 'required', message: 'O número do protocolo é obrigatório.' }
    ],
    cid_id: [
      { type: 'required', message: 'A seleção do CID é obrigatória.' }
    ],
    lawsuit: [
      { type: 'required', message: 'Informe se o laudo possui processo judicial.' }
    ],
    diagnosis: [
      { type: 'required', message: 'A descrição do diagnóstico é obrigatória.' },
      { type: 'minlength', message: 'O diagnóstico deve conter pelo menos 10 caracteres.' }
    ]
  };

  // Formulário e Controles expostos ao template (protected)
  protected updateReportForm!: FormGroup;
  protected readonly cidControl = new FormControl<string | any>('');

  // Estados reativos com Signals (protected)
  protected readonly cidReadOnly = signal<boolean>(true);
  protected readonly cidLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Filtros e opções do Autocomplete
  protected cidOptions: any[] = [];
  protected filteredCidOptions!: Observable<any[]>;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.getCids();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    this.updateReportForm = this.fb.group({
      protocol: [this.data.report.protocol, [Validators.required]],
      cid_id: [this.data.report.cid_id, [Validators.required]],
      lawsuit: [this.data.report.lawsuit, [Validators.required]],
      diagnosis: [this.data.report.diagnosis, [Validators.required]],
    });
  }

  private setCidOptions(): void {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(this.cidControl.value),
      map(value => {
        // Se for o objeto vindo do banco/seleção, filtramos apenas pelo código ou nome isolado
        if (value && typeof value === 'object') {
          return this._filterCid(value.code || value.name || '');
        }
        // Se for string (usuário digitando), filtra direto
        return value ? this._filterCid(value as string) : this.cidOptions.slice(0, 10);
      }),
    );
  }

  private _filterCid(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.cidOptions.slice(0, 10);
    }

    const filterValue = searchTerm.toLowerCase().trim();

    // Filtra buscando por ocorrência exata/parcial no código OU no nome separadamente
    return this.cidOptions
      .filter(option => 
        (option.code && option.code.toLowerCase().includes(filterValue)) || 
        (option.name && option.name.toLowerCase().includes(filterValue))
      )
      .slice(0, 10); // Mantém o limite de 10 itens para performance
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displayCid(cid: any): string {
    return cid && cid.name && cid.code ? cid.code + ' - ' + cid.name : '';
  }

  protected download(archive: number, name: string): void {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive, name);
      }
    });
  }

  protected getCids(): void {
    this.cidLoading.set(true);
    this.patientService.getCids(this.data.report.patient_care.id)
      .pipe(finalize(() => {
        this.cidLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.cidOptions = response;
          
          // 1º: Ativa a escuta do filtro com a lista populada
          this.setCidOptions(); 
          
          // 2º: Seta o objeto inicial (disparará o filtro com o objeto correto)
          if (this.data.report.cid) {
            this.cidControl.setValue(this.data.report.cid);
          }
          
          this.cidReadOnly.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cidReadOnly.set(true);
        }
      });
  }

  protected setCid(cid: any): void {
    this.updateReportForm.get('cid_id')?.setValue(cid.id);
    this.updateReportForm.markAsDirty();
  }

  protected onSubmit(): void {
    if (this.updateReportForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.patientService.updatePatientReport(this.data.report.id, this.updateReportForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Laudo atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao atualizar o laudo médico.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}