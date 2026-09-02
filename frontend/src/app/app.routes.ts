import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard, permissionAnyGuard } from './core/guards/permission.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClienteListComponent } from './pages/clientes/cliente-list.component';
import { ClienteFormComponent } from './pages/clientes/cliente-form.component';
import { ClienteDetailComponent } from './pages/clientes/cliente-detail.component';
import { InteracoesListComponent } from './pages/interacoes/interacoes-list.component';
import { UsuarioManagementComponent } from './pages/usuarios/usuario-management.component';
import { AcessoNegadoComponent } from './pages/acesso-negado/acesso-negado.component';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';
import { PermissoesComponent } from './pages/permissoes/permissoes.component';
import { MonitoraRondoniaComponent } from './pages/monitora-rondonia/monitora-rondonia.component';
import { ProgramacoesListComponent } from './pages/programacoes/programacoes-list.component';
import { ProgramacaoDetailComponent } from './pages/programacoes/programacao-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'clientes',
        component: ClienteListComponent,
        canActivate: [permissionGuard('clientes:ver')],
      },
      {
        path: 'clientes/novo',
        component: ClienteFormComponent,
        canActivate: [permissionGuard('clientes:criar')],
      },
      {
        path: 'clientes/:id',
        component: ClienteDetailComponent,
        canActivate: [permissionGuard('clientes:ver')],
      },
      {
        path: 'clientes/:id/editar',
        component: ClienteFormComponent,
        canActivate: [permissionGuard('clientes:editar')],
      },
      {
        path: 'interacoes',
        component: InteracoesListComponent,
        canActivate: [permissionGuard('interacoes:ver')],
      },
      {
        path: 'usuarios',
        component: UsuarioManagementComponent,
        canActivate: [permissionAnyGuard(['usuarios:ver', 'usuarios:gerenciar'])],
      },
      {
        path: 'permissoes',
        component: PermissoesComponent,
        canActivate: [permissionGuard('permissoes:ver')],
      },
      {
        path: 'configuracoes',
        component: ConfiguracoesComponent,
        canActivate: [permissionGuard('configuracao:ver')],
      },
      {
        path: 'monitora-rondonia',
        component: MonitoraRondoniaComponent,
        canActivate: [permissionGuard('monitora-rondonia:ver')],
      },
      {
        path: 'programacoes',
        component: ProgramacoesListComponent,
        canActivate: [permissionGuard('programacoes:ver')],
      },
      {
        path: 'programacoes/:id',
        component: ProgramacaoDetailComponent,
        canActivate: [permissionGuard('programacoes:ver')],
      },
      { path: 'acesso-negado', component: AcessoNegadoComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
