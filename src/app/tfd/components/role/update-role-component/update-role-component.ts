import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Permission } from '../../../models/permission';
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

@Component({
  selector: 'app-update-role-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './update-role-component.html',
  styleUrl: './update-role-component.scss',
})
export class UpdateRoleComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  updateRoleForm: FormGroup
  isLoading = signal<boolean>(true);

  constructor(
    private formBuilder: FormBuilder,
    private roleService: RoleService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateRoleComponent>,
  ) {
    this.updateRoleForm = this.formBuilder.group({
      name: [this.data.role.name.split('/')[1], [Validators.required]],
      permissions: [this.data.role.permissions.map((item: Permission) => item.id), [CustomValidators.permissionsValidator(2)]]
    });
  }

  ngOnInit(): void {
    this.getPermissions() 
  }

  permissions = signal<Permission[]>([])
  getPermissions() {
    this.roleService.getPermissions().subscribe({
      next: (response) => {
        this.permissions.set(response)
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  getFilteredRole(group: string) {
    return this.permissions().filter((permission: Permission) => {
      const nome = permission.name;
      const indiceBarra = nome.indexOf('/');
      const indiceUltimoEspaco = nome.lastIndexOf(' ');

      if (indiceBarra === -1) 
        return false;

      const palavraIntermediaria = indiceUltimoEspaco > indiceBarra ? nome.substring(indiceBarra + 1, indiceUltimoEspaco) : nome.substring(indiceBarra + 1);

      return palavraIntermediaria.trim() === group;
    })
  }

  togglePermission(item: Permission) {
    let permissions = this.updateRoleForm.get('permissions')?.value
    const INDEX = permissions.indexOf(item.id)
    if (permissions.includes(item.id)) {
      if (INDEX !== -1) {
        permissions.splice(INDEX, 1)
      }
    } else {
      permissions.push(item.id)
    }
    this.updateRoleForm.markAsDirty()
    this.updateRoleForm.get('permissions')?.updateValueAndValidity()
  }

  checkPermission(id: number) {
    if (this.data.role.permissions.map((item: Permission) => item.id).includes(id))
      return true
    return false
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.roleService.updateRole(this.data.role.id, this.updateRoleForm.value).subscribe({
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
