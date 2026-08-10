import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-show-cost-assistance-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './show-cost-assistance-component.html',
  styleUrl: './show-cost-assistance-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowCostAssistanceComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ShowCostAssistanceComponent>);

  protected passengerName = 'Não informado';
  protected passengerTypeLabel = '';

  ngOnInit(): void {
    this.resolvePassengerData();
  }

  /**
   * Resolve a exibição do nome e do tipo do passageiro com base no objeto vinculado à ajuda de custo
   */
  private resolvePassengerData(): void {
    const costAssistance = this.data?.cost_assistance;
    const passengerRelation = costAssistance?.passenger;

    if (!passengerRelation) {
      return;
    }

    const isPatient = !!passengerRelation?.is_patient;
    const entity = isPatient
      ? (passengerRelation?.patient || passengerRelation)
      : passengerRelation?.escort;

    const name = entity?.name || entity?.full_name;

    if (name) {
      this.passengerName = name;
      this.passengerTypeLabel = isPatient ? 'Paciente' : 'Acompanhante';
    }
  }
}