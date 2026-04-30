import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { Opinion } from '../../../models/opinion';
import { OpinionService } from '../../../services/opinion-service';
import { CreateOpinionComponent } from '../create-opinion-component/create-opinion-component';
import { UpdateOpinionComponent } from '../update-opinion-component/update-opinion-component';
import { ShowOpinionComponent } from '../show-opinion-component/show-opinion-component';
import { DeleteOpinionComponent } from '../delete-opinion-component/delete-opinion-component';

const TFD_OPINIONS_CHANNEL = new BroadcastChannel('tfd-opinions-channel');

@Component({
  selector: 'app-opinions-component',
  imports: [MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './opinions-component.html',
  styleUrl: './opinions-component.scss',
})
export class OpinionsComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','owner','is_approved','actions'];
  dataSource = signal<MatTableDataSource<Opinion>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private opinionService: OpinionService,
  ) {}

  ngOnInit(): void {
    this.getOpinions();
  }

  getOpinions() {
    this.opinionService.getOpinions(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  upgradeOpinions() {
    this.opinionService.getOpinions(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
    })
  }

  checkPermissions(name: any) {
    const ROLES = this.data.permissions
    for (const item of ROLES) {
      if (item.permissions.filter((permission: any) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  createOpinion() {
    this.dialog.open(CreateOpinionComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: this.data.patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradeOpinions()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }
  
  showOpinion(opinion: Opinion) {
    this.dialog.open(ShowOpinionComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        opinion: opinion,
      }
    })
  }

  updateOpinion(opinion: Opinion) {
    this.dialog.open(UpdateOpinionComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        opinion: opinion,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradeOpinions()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

  deleteOpinion(opinion: Opinion) {
    this.dialog.open(DeleteOpinionComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        opinion: opinion,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getOpinions()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

}
