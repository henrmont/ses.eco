import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Role } from '../../../models/role';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-roles-user-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatSlideToggleModule, MatListModule, MatProgressSpinnerModule],
  templateUrl: './roles-user-component.html',
  styleUrl: './roles-user-component.scss',
})
export class RolesUserComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  rolesUserForm: FormGroup
  isLoading = signal<boolean>(true);

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<RolesUserComponent>,
  ) {
    this.rolesUserForm = this.formBuilder.group({
      id: [this.data.user.id, [Validators.required]],
      roles: [this.data.user.roles.map((item: any) => item.id)]
    });
  }

  ngOnInit(): void {
    this.getRoles()
  }

  roles = signal<Role[]>([])
  getRoles() {
    this.userService.getRoles().subscribe({
      next: (response) => {
        this.roles.set(response)
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  toggleRole(item: Role) {
    let roles = this.rolesUserForm.get('roles')?.value
    const index = roles.indexOf(item.id)
    if (roles.includes(item.id)) {
      if (index !== -1) {
        roles.splice(index, 1)
      }
    } else {
      roles.push(item.id)
    }
    this.rolesUserForm.markAsDirty()
  }

  checkRole(id: number) {
    if (this.data.user.roles.map((item: any) => item.id).includes(id))
      return true
    return false
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.userService.rolesUser(this.data.user.id, this.rolesUserForm.value).subscribe({
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
