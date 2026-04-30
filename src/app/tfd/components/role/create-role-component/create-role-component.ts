import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Permission } from '../../../models/permission';
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-role-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './create-role-component.html',
  styleUrl: './create-role-component.scss',
})
export class CreateRoleComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  createRoleForm: FormGroup
  isLoading = signal<boolean>(true);

  constructor(
    private formBuilder: FormBuilder,
    private roleService: RoleService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateRoleComponent>,
  ) {
    this.createRoleForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      permissions: [[], [CustomValidators.permissionsValidator()]]
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
        this.isLoading.set(false)
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
    let permissions = this.createRoleForm.get('permissions')?.value
    const INDEX = permissions.indexOf(item.id)
    if (permissions.includes(item.id)) {
      if (INDEX !== -1) {
        permissions.splice(INDEX, 1)
      }
    } else {
      permissions.push(item.id)
    }
    this.createRoleForm.get('permissions')?.updateValueAndValidity()
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.roleService.createRole(this.createRoleForm.value).subscribe({
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
