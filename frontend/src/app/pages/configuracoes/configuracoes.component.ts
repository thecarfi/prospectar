import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { SegmentoCrudComponent } from './segmento-crud.component';

@Component({
  selector: 'app-configuracoes',
  imports: [MatTabsModule, SegmentoCrudComponent],
  template: `
    <div class="header">
      <h1>Configurações</h1>
    </div>

    <mat-tab-group animationDuration="0ms">
      <mat-tab label="Segmentos">
        <div class="tab-content">
          <app-segmento-crud></app-segmento-crud>
        </div>
      </mat-tab>
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
export class ConfiguracoesComponent {}
