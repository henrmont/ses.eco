import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-user-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-user-component.html',
  styleUrl: './delete-user-component.scss',
})
export class DeleteUserComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private dialog: MatDialogRef<DeleteUserComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.userService.deleteUser(this.data.user.id).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialog.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
