import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-role-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-role-component.html',
  styleUrl: './delete-role-component.scss',
})
export class DeleteRoleComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private roleService: RoleService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteRoleComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.roleService.deleteRole(this.data.role.id).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
