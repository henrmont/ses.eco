import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-lock-user-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './lock-user-component.html',
  styleUrl: './lock-user-component.scss',
})
export class LockUserComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<LockUserComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.userService.lockUser(this.data.user.id).subscribe({
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
