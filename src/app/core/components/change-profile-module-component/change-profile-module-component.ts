import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ProfileService } from '../../services/profile-service';
import { AvaliableModules } from '../../enums/avaliable-modules';

// Definindo a interface para tipar o item do módulo
interface UserModule {
  id: number;
  name: string;
}

@Component({
  selector: 'app-change-profile-module-component',
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './change-profile-module-component.html',
  styleUrl: './change-profile-module-component.scss',
})
export class ChangeProfileModuleComponent {

  public data = inject(MAT_DIALOG_DATA);

  constructor(
    private profileService: ProfileService,
  ) {}

  /**
   * Getter que filtra dinamicamente os módulos que o usuário possui 
   * contra os módulos que este sistema específico suporta.
   */
  get filteredModules(): UserModule[] {
    if (!this.data?.user?.valid_modules) return [];
    
    // Pega todos os valores válidos do enum do sistema (ex: ['tfd', 'juridico', 'financeiro'])
    const systemModules = Object.values(AvaliableModules) as string[];

    // Retorna apenas os módulos do usuário que estão contidos no enum do sistema
    return this.data.user.valid_modules.filter((mod: UserModule) => 
      systemModules.includes(mod.name)
    );
  }

  changeProfileModule(module: number) {
    this.profileService.changeProfileModule(module).subscribe({
      complete: () => {
        window.location.href = 'principal';
      }
    });
  }

  checkModule(module: number): boolean {
    return this.data?.user?.module_id === module;
  }
}