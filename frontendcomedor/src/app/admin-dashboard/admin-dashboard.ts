import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';
import { ReservaService } from '../services/reserva.service';
import { DashboardService } from '../services/dashboard.service';
import { ConfigService, ComedorConfig } from '../services/config.service';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

interface Menu {
  id?: number;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  stock: number;
  publicado: boolean;
  fechaMenu?: string;
  disponibleDesde?: string;
  disponibleHasta?: string;
}

interface Becado {
  id?: number;
  nombre: string;
  codigo: string;
  dni: string;
  activo: boolean;
  fechaRegistro: string;
}

interface Reserva {
  id: number;
  estudiante: string;
  menu: string;
  fecha: string;
  total: number;
  estado: string;
  tipo: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, DecimalPipe, FormsModule]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentTab = 'dashboard';
  currentUser: any = null;
  loading: boolean = false;
  private pendingLoads = 0;

  // Data from backend
  menus: Menu[] = [];
  becados: Becado[] = [];
  reservas: Reserva[] = [];
  
  // Dashboard statistics
  ventasHoy: number = 0;
  ingresosTotales: number = 0;
  reservasHoy: number = 0;
  recogidasHoy: number = 0;
  menusDisponibles: number = 0;
  menusActivos: number = 0;
  becadosTotal: number = 0;
  becadosActivos: number = 0;
  actividadReciente: any[] = [];
  menusMasVendidos: any[] = [];
  reservasRaw: any[] = [];
  ventasPorMenu: { nombre: string; monto: number; pct: number }[] = [];
  tendenciaVentas: { label: string; monto: number; pct: number }[] = [];

  comedorConfig: ComedorConfig = {
    nombreComedor: 'Comedor UPeU',
    horario: '07:00 - 20:00',
    direccion: 'Universidad Peruana Unión, Carretera Central km. 18.5',
    logoUrl: ''
  };
  configForm: ComedorConfig = { ...this.comedorConfig };
  private configSub?: Subscription;

  // Modal states
  showMenuModal = false;
  showBecadoModal = false;

  // Form data
  menuForm: Menu = {
    nombre: '',
    categoria: '',
    precio: 0,
    descripcion: '',
    stock: 0,
    publicado: true,
    disponibleDesde: '07:00',
    disponibleHasta: '20:00'
  };

  becadoForm: Becado = {
    nombre: '',
    codigo: '',
    dni: '',
    activo: true,
    fechaRegistro: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private menuService: MenuService,
    private reservaService: ReservaService,
    private dashboardService: DashboardService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('AdminDashboard - ngOnInit - usuario actual:', this.currentUser);
    
    // Verificar token
    const token = localStorage.getItem('token');
    console.log('AdminDashboard - ngOnInit - token en localStorage:', token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('AdminDashboard - ngOnInit - token payload:', payload);
        const currentTime = Math.floor(Date.now() / 1000);
        console.log('AdminDashboard - ngOnInit - current time:', currentTime);
        console.log('AdminDashboard - ngOnInit - token exp:', payload.exp);
        console.log('AdminDashboard - ngOnInit - token expired:', payload.exp < currentTime);
      } catch (e) {
        console.error('AdminDashboard - ngOnInit - error decoding token:', e);
      }
    }
    
    if (!this.currentUser) {
      console.log('AdminDashboard - ngOnInit - no hay usuario autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }
    
    if (this.currentUser.rol !== 'ADMIN') {
      console.log('AdminDashboard - ngOnInit - usuario no es admin, redirigiendo a login. Rol actual:', this.currentUser.rol);
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('AdminDashboard - ngOnInit - usuario válido, cargando datos');
    this.comedorConfig = this.configService.getConfig();
    this.configForm = { ...this.comedorConfig };
    this.configSub = this.configService.config$.subscribe(cfg => {
      this.comedorConfig = cfg;
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.pendingLoads = 5;
    this.loadMenus();
    this.loadReservas();
    this.loadDashboardData();
  }

  private markLoadComplete(): void {
    this.pendingLoads = Math.max(0, this.pendingLoads - 1);
    if (this.pendingLoads === 0) {
      this.recalcularEstadisticas();
      this.loading = false;
    }
  }

  loadMenus(): void {
    this.menuService.listarTodos().subscribe({
      next: (data) => {
        this.menus = data.map((menu: any) => ({
          id: menu.id,
          nombre: menu.nombre,
          categoria: menu.horario || menu.categoria || 'Almuerzo',
          precio: menu.precio,
          descripcion: menu.descripcion,
          stock: menu.disponibles ?? menu.stock ?? 0,
          publicado: menu.publicado,
          fechaMenu: menu.fechaMenu,
          disponibleDesde: menu.horaInicio || menu.disponibleDesde || '11:00',
          disponibleHasta: menu.horaFin || menu.disponibleHasta || '14:00'
        }));
        this.menusDisponibles = this.menus.length;
        this.menusActivos = this.menus.filter(m => m.publicado).length;
        this.enriquecerMenusTop();
        this.markLoadComplete();
      },
      error: (err) => {
        console.error('Error loading menus:', err);
        this.markLoadComplete();
      }
    });
  }

  loadReservas(): void {
    this.reservaService.listarTodas().subscribe({
      next: (data) => {
        this.reservasRaw = data || [];
        this.reservas = this.reservasRaw.map((reserva: any) => ({
          id: reserva.id,
          estudiante: reserva.nombreCliente || reserva.usuario?.nombreCompleto || reserva.usuario?.username || 'Cliente desconocido',
          menu: reserva.menu?.nombre || 'Menú no especificado',
          fecha: reserva.fechaReserva || new Date().toISOString(),
          total: reserva.total || 0,
          estado: (reserva.estado || 'PENDIENTE').toString(),
          tipo: reserva.tipo || 'Reserva'
        }));
        this.recalcularEstadisticas();
        this.markLoadComplete();
      },
      error: (err) => {
        console.error('Error loading reservations:', err);
        this.markLoadComplete();
      }
    });
  }

  loadDashboardData(): void {
    console.log('AdminDashboard - loadDashboardData - iniciando carga de datos del dashboard');
    
    // Load dashboard statistics from backend
    this.dashboardService.getEstadisticas().subscribe({
      next: (data) => {
        console.log('AdminDashboard - loadDashboardData - datos de estadísticas recibidos:', data);
        if (data.ingresosTotales != null) {
          this.ingresosTotales = data.ingresosTotales;
        }
        this.becadosTotal = data.becadosTotal || 0;
        this.becadosActivos = data.becadosActivos || 0;
        this.recalcularEstadisticas();
        this.markLoadComplete();
      },
      error: (err) => {
        console.error('AdminDashboard - loadDashboardData - error cargando estadísticas:', err);
        this.recalcularEstadisticas();
        this.markLoadComplete();
      }
    });

    // Load recent activity
    this.dashboardService.getActividadReciente().subscribe({
      next: (data) => {
        console.log('AdminDashboard - loadDashboardData - datos de actividad reciente recibidos:', data);
        this.actividadReciente = data;
        this.markLoadComplete();
      },
      error: (err) => {
        console.error('AdminDashboard - loadDashboardData - error cargando actividad reciente:', err);
        this.actividadReciente = [];
        this.markLoadComplete();
      }
    });

    // Load top selling menus
    this.dashboardService.getMenusMasVendidos().subscribe({
      next: (data) => {
        console.log('AdminDashboard - loadDashboardData - datos de menús más vendidos recibidos:', data);
        this.menusMasVendidos = data;
        this.enriquecerMenusTop();
        this.markLoadComplete();
      },
      error: (err) => {
        console.error('AdminDashboard - loadDashboardData - error cargando menús más vendidos:', err);
        this.menusMasVendidos = [];
        this.markLoadComplete();
      }
    });
  }

  cambiarTab(tab: string): void {
    this.currentTab = tab;
    if (tab === 'menus') {
      this.loadMenus();
    }
    if (tab === 'reservas') {
      this.loadReservas();
    }
    if (tab === 'estadisticas' || tab === 'dashboard') {
      this.recalcularEstadisticas();
    }
    if (tab === 'configuracion') {
      this.configForm = { ...this.comedorConfig };
    }
  }

  private recalcularEstadisticas(): void {
    const reservas = this.reservasRaw || [];

    const hoyReservas = reservas.filter(r => this.esReservaDeHoy(r));
    this.ventasHoy = hoyReservas.reduce((s, r) => s + (Number(r.total) || 0), 0);
    this.reservasHoy = hoyReservas.length;
    this.recogidasHoy = hoyReservas.filter(r =>
      String(r.estado || '').toUpperCase() === 'RECOGIDO'
    ).length;

    const ingresosReservas = reservas.reduce((s, r) => s + (Number(r.total) || 0), 0);
    if (ingresosReservas > 0) {
      this.ingresosTotales = ingresosReservas;
    }

    const mapMenu = new Map<string, number>();
    reservas.forEach(r => {
      const nombre = r.menu?.nombre || 'Sin menú';
      mapMenu.set(nombre, (mapMenu.get(nombre) || 0) + (Number(r.total) || 0));
    });
    const arrMenu = Array.from(mapMenu.entries()).map(([nombre, monto]) => ({ nombre, monto }));
    const maxMenu = Math.max(...arrMenu.map(x => x.monto), 1);
    this.ventasPorMenu = arrMenu
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 6)
      .map(x => ({ ...x, pct: Math.round((x.monto / maxMenu) * 100) }));

    const dias: { label: string; key: string; monto: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = this.formatFechaLocal(d);
      const label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
      dias.push({ label, key, monto: 0 });
    }
    reservas.forEach(r => {
      const key = this.extraerFechaLocal(r.fechaReserva);
      const dia = dias.find(d => d.key === key);
      if (dia) {
        dia.monto += Number(r.total) || 0;
      }
    });
    const maxDia = Math.max(...dias.map(d => d.monto), 1);
    this.tendenciaVentas = dias.map(d => ({
      label: d.label,
      monto: d.monto,
      pct: Math.round((d.monto / maxDia) * 100)
    }));

    this.enriquecerMenusTop();
  }

  private fechaLocalHoy(): string {
    return this.formatFechaLocal(new Date());
  }

  private formatFechaLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private extraerFechaLocal(fecha: unknown): string {
    if (!fecha) return '';
    const s = String(fecha);
    if (s.length >= 10 && s[4] === '-') {
      return s.substring(0, 10);
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return this.formatFechaLocal(d);
  }

  private esReservaDeHoy(reserva: any): boolean {
    const fecha = reserva?.fechaReserva ?? reserva?.fecha;
    return this.extraerFechaLocal(fecha) === this.fechaLocalHoy();
  }

  alturaTendencia(pct: number): number {
    return pct > 0 ? Math.max(pct, 8) : 4;
  }

  private enriquecerMenusTop(): void {
    if (!this.menusMasVendidos.length && this.reservasRaw.length) {
      const map = new Map<string, { vendidos: number; total: number; precio: number }>();
      this.reservasRaw.forEach(r => {
        const nombre = r.menu?.nombre || 'Desconocido';
        const cant = Number(r.cantidad) || 1;
        const total = Number(r.total) || 0;
        const precio = Number(r.menu?.precio) || (cant ? total / cant : 0);
        const cur = map.get(nombre) || { vendidos: 0, total: 0, precio };
        map.set(nombre, {
          vendidos: cur.vendidos + cant,
          total: cur.total + total,
          precio: precio || cur.precio
        });
      });
      this.menusMasVendidos = Array.from(map.entries())
        .sort((a, b) => b[1].vendidos - a[1].vendidos)
        .slice(0, 5)
        .map(([nombre, v], i) => ({
          posicion: i + 1,
          nombre,
          vendidos: v.vendidos,
          precio: v.precio,
          total: v.total
        }));
      return;
    }

    this.menusMasVendidos = this.menusMasVendidos.map(m => {
      const menuCat = this.menus.find(x => x.nombre === m.nombre);
      const precio = Number(m.precio) || menuCat?.precio || 0;
      const total = Number(m.total) || precio * Number(m.vendidos || 0);
      return { ...m, precio, total };
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecciona una imagen (PNG, JPG, WEBP, etc.)');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('El logo debe pesar menos de 2 MB');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.configForm.logoUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  quitarLogo(): void {
    this.configForm.logoUrl = '';
  }

  guardarConfiguracion(): void {
    this.configService.saveConfig(this.configForm);
    this.comedorConfig = this.configService.getConfig();
    alert('Configuración guardada. El logo se verá en todos los paneles.');
  }

  // Menu management - admin solo edita y elimina
  abrirModalEditar(menu: Menu): void {
    this.menuForm = {
      ...menu,
      categoria: menu.categoria || 'Almuerzo',
      disponibleDesde: menu.disponibleDesde || '11:00',
      disponibleHasta: menu.disponibleHasta || '14:00'
    };
    this.showMenuModal = true;
  }

  cerrarModal(): void {
    this.showMenuModal = false;
  }

  private construirMenuPayload(): any {
    return {
      nombre: this.menuForm.nombre,
      descripcion: this.menuForm.descripcion || '',
      precio: this.menuForm.precio,
      horario: this.menuForm.categoria || 'Almuerzo',
      fechaMenu: this.menuForm.fechaMenu,
      horaInicio: this.menuForm.disponibleDesde || '11:00',
      horaFin: this.menuForm.disponibleHasta || '14:00',
      disponibles: this.menuForm.stock ?? 0,
      publicado: this.menuForm.publicado
    };
  }

  guardarMenu(): void {
    if (!this.menuForm.id) {
      alert('El administrador no puede crear menús. Solo el vendedor puede agregar menús del día.');
      return;
    }

    this.menuService.actualizar(this.menuForm.id, this.construirMenuPayload()).subscribe({
      next: (updatedMenu) => {
        const index = this.menus.findIndex(m => m.id === this.menuForm.id);
        if (index !== -1) {
          this.menus[index] = {
            ...this.menus[index],
            nombre: updatedMenu.nombre,
            categoria: updatedMenu.horario || this.menuForm.categoria,
            precio: updatedMenu.precio,
            stock: updatedMenu.disponibles ?? this.menuForm.stock,
            publicado: updatedMenu.publicado,
            fechaMenu: updatedMenu.fechaMenu,
            disponibleDesde: updatedMenu.horaInicio,
            disponibleHasta: updatedMenu.horaFin
          };
        }
        this.cerrarModal();
        alert('Menú actualizado correctamente');
      },
      error: (err) => {
        console.error('Error updating menu:', err);
        alert('Error al actualizar el menú');
      }
    });
  }

  eliminarMenu(id: number | undefined): void {
    if (id === undefined) return;
    if (confirm('¿Está seguro de eliminar este menú?')) {
      this.menuService.eliminar(id).subscribe({
        next: () => {
          this.menus = this.menus.filter(menu => menu.id !== id);
        },
        error: (err) => {
          console.error('Error deleting menu:', err);
          alert('Error al eliminar el menú');
        }
      });
    }
  }

  // Becado management methods
  abrirModalNuevoBecado(): void {
    this.becadoForm = {
      nombre: '',
      codigo: '',
      dni: '',
      activo: true,
      fechaRegistro: ''
    };
    this.showBecadoModal = true;
  }

  abrirModalEditarBecado(becado: Becado): void {
    this.becadoForm = { ...becado };
    this.showBecadoModal = true;
  }

  cerrarModalBecado(): void {
    this.showBecadoModal = false;
  }

  guardarBecado(): void {
    // In a real implementation, this would call a service
    if (this.becadoForm.id) {
      // Update existing becado
      const index = this.becados.findIndex(b => b.id === this.becadoForm.id);
      if (index !== -1) {
        this.becados[index] = { ...this.becadoForm };
      }
    } else {
      // Create new becado
      const newBecado: Becado = {
        ...this.becadoForm,
        id: Math.max(...this.becados.map(b => b.id || 0), 0) + 1,
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      this.becados.push(newBecado);
    }
    this.cerrarModalBecado();
  }

  eliminarBecado(id: number | undefined): void {
    if (id === undefined) return;
    if (confirm('¿Está seguro de eliminar este becado?')) {
      this.becados = this.becados.filter(becado => becado.id !== id);
    }
  }
}