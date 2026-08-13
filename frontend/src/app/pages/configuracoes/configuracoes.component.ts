import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';
import { SegmentoCrudComponent } from './segmento-crud.component';
import { StatusClienteCrudComponent } from './status-crud.component';
import { CnaeConsultaComponent } from './cnae-consulta.component';

@Component({
  selector: 'app-configuracoes',
  imports: [
    MatTabsModule,
    SegmentoCrudComponent,
    StatusClienteCrudComponent,
    CnaeConsultaComponent,
  ],
  template: `
    <div class="header">
      <h1>Configurações</h1>
    </div>

    <mat-tab-group animationDuration="0ms">
      @if (auth.temPermissao('segmentos:ver')) {
        <mat-tab label="Segmentos">
          <div class="tab-content">
            <app-segmento-crud></app-segmento-crud>
          </div>
        </mat-tab>
      }
      @if (auth.temPermissao('status_clientes:ver')) {
        <mat-tab label="Status de Clientes">
          <div class="tab-content">
            <app-status-crud></app-status-crud>
          </div>
        </mat-tab>
      }
      @if (auth.temPermissao('cnae:ver')) {
        <mat-tab label="CNAE">
          <div class="tab-content">
            <app-cnae-consulta></app-cnae-consulta>
          </div>
        </mat-tab>
      }
    </mat-tab-group>
  `,
  styles: `
    .header h1 {
      margin-top: 0;
    }
    .tab-content {
      padding-top: 16px;
    }
  `,
})
export class ConfiguracoesComponent {
  readonly auth = inject(AuthService);
}
