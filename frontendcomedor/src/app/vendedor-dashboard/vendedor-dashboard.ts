import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';
import { PedidoService } from '../services/pedido.service';
import { ReservaService } from '../services/reserva.service';
import { BoletaService } from '../services/boleta.service';
import { ConfigService, ComedorConfig } from '../services/config.service';

@Component({
  selector: 'app-vendedor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendedor-dashboard.html',
  styleUrls: ['./vendedor-dashboard.css']
})
export class VendedorDashboardComponent implements OnInit, OnDestroy {

  readonly API_URL = 'http://localhost:8080';

  // Método para construir URLs de imágenes
  getImageUrl(imagenUrl: string | undefined): string {
    // Para imágenes del backend, intentamos cargarlas directamente
    // Si el backend requiere autenticación, esto fallará
    // En ese caso, podríamos necesitar un endpoint proxy
    return imagenUrl ? `${this.API_URL}${imagenUrl}` : 'https://via.placeholder.com/150';
  }

  // Método para manejar errores de carga de imágenes
  onImageError(event: any): void {
    console.log('Error loading image, showing placeholder');
    event.target.src = 'https://via.placeholder.com/150';
  }

  currentUser: any = null;

  get userInitials(): string {
    const name = this.currentUser?.nombreCompleto || this.currentUser?.nombre_completo || this.currentUser?.username || 'VE';
    return String(name).slice(0, 2).toUpperCase();
  }

  get userDisplayName(): string {
    return this.currentUser?.nombreCompleto || this.currentUser?.nombre_completo || this.currentUser?.username || 'Vendedor';
  }

  currentTab: string = 'dashboard'; // dashboard, menus, pedidos, escanear, entregas, boletas
  
  // Indicador de carga
  loading: boolean = false;
  
  // Datos para Menú del Día
  menus: any[] = [];
  totalMenus: number = 0;
  menusPublicados: number = 0;
  stockTotal: number = 0;
  
  // Datos para Dashboard
  menusEntregados: number = 0;
  pagosVerificados: number = 0;
  boletasGeneradas: number = 0;
  ventasHoy: number = 0;
  reservasHoy: number = 0;
  menusDisponibles: any[] = [];
  ultimasEntregas: any[] = [];
  menusMasVendidos: any[] = [];
  
  // Datos para Entregas
  entregasPendientes: number = 0;
  estudiantesConBeca: number = 0;
  pagosPendientes: number = 0;
  reservasPendientes: any[] = [];
  
  // Datos reales de reservas para la sección de pedidos
  reservasReales: any[] = [];
  reservasVisibles: any[] = [];
  
  // Filtro para pedidos
  filtroPedidos: string = 'todas'; // todas, pendientes, completadas, canceladas
  buscarPedidoTexto: string = '';
  
  // Datos para Boletas
  boletas: any[] = [];
  pedidosUsuario: any[] = [];
  buscarUsuarioId: string | number | null = null;

  comedorConfig: ComedorConfig = {
    nombreComedor: 'Comedor UPeU',
    horario: '07:00 - 20:00',
    direccion: '',
    logoUrl: ''
  };
  private configSub?: Subscription;
  
  // Propiedad computada para el total de pedidos
  get totalPedidos(): number {
    return this.pedidosUsuario.reduce((sum, p) => sum + (p.total || 0), 0);
  };
  
  // Modal de crear/editar menú
  showMenuModal: boolean = false;
  showDetalleModal: boolean = false;
  pedidoDetalle: any = null;
  selectedFile: File | null = null;
  menuForm: any = {
    id: null,
    nombre: '',
    categoria: 'Almuerzo',
    precio: 0,
    descripcion: '',
    stock: 50,
    fechaMenu: '',
    disponibleDesde: '11:00',
    disponibleHasta: '14:00',
    publicado: true,
    imagenUrl: ''
  };

  private fechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  private mapearMenuForm(menu: any): any {
    return {
      ...menu,
      categoria: menu.categoria || menu.horario || 'Almuerzo',
      stock: menu.stock ?? menu.disponibles ?? 0,
      fechaMenu: menu.fechaMenu || this.fechaHoy(),
      disponibleDesde: menu.disponibleDesde || menu.horaInicio || '11:00',
      disponibleHasta: menu.disponibleHasta || menu.horaFin || '14:00'
    };
  }

  private construirMenuPayload(): any {
    return {
      nombre: this.menuForm.nombre,
      descripcion: this.menuForm.descripcion || '',
      precio: this.menuForm.precio,
      horario: this.menuForm.categoria || 'Almuerzo',
      fechaMenu: this.menuForm.fechaMenu || this.fechaHoy(),
      horaInicio: this.menuForm.disponibleDesde || '11:00',
      horaFin: this.menuForm.disponibleHasta || '14:00',
      disponibles: this.menuForm.stock || 0,
      publicado: this.menuForm.publicado ?? true
    };
  }

  constructor(
    private authService: AuthService,
    private menuService: MenuService,
    private pedidoService: PedidoService,
    private reservaService: ReservaService,
    private boletaService: BoletaService,
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || this.currentUser.rol !== 'VENDEDOR') {
      console.error('Usuario no autorizado o no es vendedor:', this.currentUser);
      this.router.navigate(['/login']);
      return;
    }
    console.log('Usuario actual:', this.currentUser);
    this.comedorConfig = this.configService.getConfig();
    this.configSub = this.configService.config$.subscribe(cfg => {
      this.comedorConfig = cfg;
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  loadData() {
    this.loading = true;
    this.loadMenus(() => {
      this.cargarReservasVendedor(() => {
        this.cargarBoletasVendedor(() => this.checkLoadingComplete());
      });
    });
    
    setTimeout(() => {
      if (this.loading) {
        this.loading = false;
      }
    }, 10000);
  }
  
  loadMenus(onComplete?: () => void) {
    if (!this.currentUser) {
      onComplete?.();
      return;
    }
    const vendedorId = this.resolverVendedorId();
    console.log('VendedorDashboard - loadMenus - vendedorId:', vendedorId);

    const aplicarMenus = (data: any[]) => {
      this.menus = data || [];
      this.totalMenus = this.menus.length;
      this.menusPublicados = this.menus.filter((m: any) => m.publicado).length;
      this.stockTotal = this.menus.reduce((sum: number, m: any) => sum + (m.disponibles ?? m.stock ?? 0), 0);
      this.menusDisponibles = this.menus
        .filter((m: any) => m.publicado)
        .map((menu: any) => ({
          nombre: menu.nombre,
          precio: menu.precio,
          disponibles: menu.stock,
          total: menu.stock
        }))
        .slice(0, 4);
      this.resolverVendedorId();
      onComplete?.();
    };

    if (vendedorId > 0) {
      this.menuService.listarPorVendedor(vendedorId).subscribe({
        next: (data) => aplicarMenus(data),
        error: (err) => {
          console.error('Error al cargar menús por vendedor:', err);
          if (err.status === 401) {
            alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          this.menuService.listarTodos().subscribe({
            next: (todos) => aplicarMenus(this.filtrarMenusDelVendedor(todos || [])),
            error: () => aplicarMenus([])
          });
        }
      });
      return;
    }

    this.menuService.listarTodos().subscribe({
      next: (todos) => aplicarMenus(this.filtrarMenusDelVendedor(todos || [])),
      error: () => aplicarMenus([])
    });
  }

  private filtrarMenusDelVendedor(menus: any[]): any[] {
    const vendedorId = this.resolverVendedorId();
    const username = String(this.currentUser?.username || '').toLowerCase();
    return menus.filter(m =>
      (vendedorId > 0 && Number(m.vendedor?.id) === vendedorId) ||
      (username && String(m.vendedor?.username || '').toLowerCase() === username)
    );
  }

  private resolverVendedorId(): number {
    const fromUser = Number(this.currentUser?.id);
    if (!Number.isNaN(fromUser) && fromUser > 0) {
      return fromUser;
    }

    try {
      const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const fromStorage = Number(stored.id);
      if (!Number.isNaN(fromStorage) && fromStorage > 0) {
        this.currentUser = { ...this.currentUser, id: fromStorage };
        return fromStorage;
      }
    } catch {
      // ignore
    }

    const fromMenu = Number((this.menus || []).find(m => m.vendedor?.id)?.vendedor?.id);
    if (!Number.isNaN(fromMenu) && fromMenu > 0) {
      this.currentUser = { ...this.currentUser, id: fromMenu };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return fromMenu;
    }

    return 0;
  }

  loadDashboardData() {
    if (!this.currentUser) return;
    this.cargarReservasVendedor(() => this.checkLoadingComplete());
    this.cargarBoletasVendedor(() => this.checkLoadingComplete());
  }

  loadEntregas() {
    this.cargarReservasVendedor(() => this.checkLoadingComplete());
  }

  recargarPedidos(): void {
    this.cargarReservasVendedor(() => this.actualizarReservasVisibles());
  }

  private cargarReservasVendedor(onComplete?: () => void) {
    if (!this.currentUser) {
      onComplete?.();
      return;
    }

    const vendedorId = this.resolverVendedorId();
    const username = this.currentUser.username || 'vendedor';
    const menuIds = (this.menus || []).map(m => m.id).filter(Boolean);

    console.log('Cargando reservas vendedor', { vendedorId, username, menuIds });

    this.reservaService.listarParaVendedor({ vendedorId, username, menuIds }).subscribe({
      next: (reservas) => {
        console.log('Reservas cargadas para vendedor:', reservas?.length, reservas);
        this.aplicarReservasVendedor(this.normalizarReservas(reservas || []));
        this.actualizarReservasVisibles();
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading reservations for vendor:', err);
        this.reservasReales = [];
        this.actualizarReservasVisibles();
        onComplete?.();
      }
    });
  }

  private normalizarReservas(reservas: any[]): any[] {
    return reservas.map(r => ({
      ...r,
      estado: String(r.estado || 'PENDIENTE').toUpperCase()
    }));
  }

  private normalizarEstado(estado: unknown): string {
    return String(estado || 'PENDIENTE').toUpperCase();
  }

  private esPendiente(estado: unknown): boolean {
    const e = this.normalizarEstado(estado);
    return e === 'PENDIENTE' || e === 'PAGO_VERIFICADO';
  }

  private aplicarReservasVendedor(reservas: any[]) {
    this.reservasReales = reservas;
    this.menusEntregados = reservas.filter((r: any) => this.normalizarEstado(r.estado) === 'RECOGIDO').length;
    this.pagosVerificados = reservas.filter((r: any) => this.normalizarEstado(r.estado) === 'PAGO_VERIFICADO').length;
    this.estudiantesConBeca = reservas.filter((r: any) => r.tipo === 'Beca').length;
    this.entregasPendientes = reservas.filter((r: any) => this.esPendiente(r.estado)).length;
    this.pagosPendientes = reservas.filter((r: any) => this.normalizarEstado(r.estado) === 'PENDIENTE').length;

    const reservasDelDia = reservas.filter((r: any) => this.esFechaHoy(r.fechaReserva));
    this.ventasHoy = reservasDelDia.reduce((s: number, r: any) => s + (Number(r.total) || 0), 0);
    this.reservasHoy = reservasDelDia.length;

    const recientes = [...reservas]
      .sort((a: any, b: any) => new Date(b.fechaReserva).getTime() - new Date(a.fechaReserva).getTime())
      .slice(0, 6);

    this.ultimasEntregas = recientes.map((reserva: any) => ({
      nombre: reserva.nombreCliente || reserva.usuario?.nombreCompleto || reserva.usuario?.username || 'Cliente desconocido',
      menu: reserva.menu?.nombre || 'Menú no especificado',
      tipo: reserva.tipo || 'Reserva',
      estado: reserva.estado,
      total: reserva.total || 0,
      hora: reserva.fechaReserva
        ? new Date(reserva.fechaReserva).toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '—'
    }));

    this.reservasPendientes = reservas
      .filter((r: any) => this.esPendiente(r.estado))
      .slice(0, 5)
      .map((reserva: any) => ({
        id: reserva.id,
        codigo: reserva.usuario?.id || 'N/A',
        estudiante: reserva.nombreCliente || reserva.usuario?.nombreCompleto || reserva.usuario?.username || 'Cliente desconocido',
        menu: reserva.menu?.nombre || 'Menú no especificado',
        horario: reserva.menu?.horario || 'Horario no especificado',
        pago: reserva.metodoPago || 'Método no especificado',
        becado: reserva.tipo === 'Beca',
        estado: reserva.estado,
        total: reserva.total,
        fechaReserva: reserva.fechaReserva
      }));

    this.calcularMenusMasVendidos(reservas);
    this.actualizarReservasVisibles();
  }

  private cargarBoletasVendedor(onComplete?: () => void) {
    if (!this.currentUser?.id) return;

    this.boletaService.listarPorVendedor(this.currentUser.id).subscribe({
      next: (data) => {
        this.boletas = data || [];
        this.boletasGeneradas = this.boletas.length;
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading receipts:', err);
        this.boletas = [];
        this.boletasGeneradas = this.reservasReales?.length || 0;
        onComplete?.();
      }
    });
  }

  loadBoletas() {
    this.cargarBoletasVendedor(() => this.checkLoadingComplete());
  }

  checkLoadingComplete() {
    // Verificar si todas las cargas críticas han terminado
    const menusLoaded = this.menus !== undefined;
    const reservasLoaded = this.reservasReales !== undefined;
    const boletasLoaded = this.boletas !== undefined;
    
    // Desactivar loading si todas las cargas críticas han terminado
    if (menusLoaded && reservasLoaded && boletasLoaded) {
      this.loading = false;
    }
  }

  cambiarTab(tab: string): void {
    this.currentTab = tab;
    if (tab === 'menus') {
      this.loadMenus();
    }
    if (tab === 'pedidos') {
      this.filtroPedidos = 'todas';
      this.cargarReservasVendedor(() => this.actualizarReservasVisibles());
    }
    if (tab === 'entregas' || tab === 'dashboard') {
      this.cargarReservasVendedor();
    }
    if (tab === 'boletas' || tab === 'dashboard') {
      this.cargarBoletasVendedor();
    }
  }

  // Métodos para Menús
  abrirModalCrear() {
    this.menuForm = {
      id: null,
      nombre: '',
      categoria: 'Almuerzo',
      precio: 0,
      descripcion: '',
      stock: 50,
      fechaMenu: this.fechaHoy(),
      disponibleDesde: '11:00',
      disponibleHasta: '14:00',
      publicado: true,
      imagenUrl: ''
    };
    this.selectedFile = null;
    this.showMenuModal = true;
  }

  abrirModalEditar(menu: any) {
    this.menuForm = this.mapearMenuForm(menu);
    this.selectedFile = null;
    this.showMenuModal = true;
  }

  onCategoriaChange() {
    if (this.menuForm.categoria === 'Cena') {
      this.menuForm.disponibleDesde = '18:00';
      this.menuForm.disponibleHasta = '21:00';
    } else {
      this.menuForm.disponibleDesde = '11:00';
      this.menuForm.disponibleHasta = '14:00';
    }
  }

  cerrarModal() {
    this.showMenuModal = false;
    this.selectedFile = null;
  }

  // Método para manejar la selección de archivo
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Método para abrir el selector de archivos
  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Método para subir imagen a un menú
  subirImagen(menuId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      // Usar HttpClient directamente para la subida de archivos
      const xhr = new XMLHttpRequest();
      const token = this.authService.getToken();
      
      xhr.open('POST', `http://localhost:8080/api/menus/${menuId}/imagen`, true);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject(new Error('Error al subir imagen'));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Error de red al subir imagen'));
      };
      
      xhr.send(formData);
    });
  }

  guardarMenu() {
    // Validar campos requeridos
    if (!this.menuForm.nombre || !this.menuForm.categoria || !this.menuForm.precio || !this.menuForm.fechaMenu) {
      alert('Completa nombre, turno, fecha, precio y cantidad disponible.');
      return;
    }
    if (!this.menuForm.stock || this.menuForm.stock < 1) {
      alert('Indica cuántas porciones estarán disponibles (mínimo 1).');
      return;
    }

    const menuData = this.construirMenuPayload();

    console.log('Guardando menú:', menuData);

    if (this.menuForm.id) {
      // Editar
      this.menuService.actualizar(this.menuForm.id, menuData).subscribe({
        next: (menuActualizado) => {
          console.log('Menú actualizado:', menuActualizado);
          // Si hay una imagen seleccionada, subirla
          if (this.selectedFile) {
            this.subirImagen(this.menuForm.id).then(() => {
              alert('Menú actualizado exitosamente');
              this.cerrarModal();
              this.loadMenus();
            }).catch((error) => {
              console.error('Error al subir imagen:', error);
              alert('Menú actualizado pero hubo un error al subir la imagen');
              this.cerrarModal();
              this.loadMenus();
            });
          } else {
            alert('Menú actualizado exitosamente');
            this.cerrarModal();
            this.loadMenus();
          }
        },
        error: (err) => {
          console.error('Error completo al actualizar menú:', err);
          let mensaje = 'Error al actualizar el menú';
          if (err.status === 0) {
            mensaje = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
          } else if (err.error?.message) {
            mensaje = err.error.message;
          }
          alert(mensaje);
        }
      });
    } else {
      // Crear
      this.menuService.crear(menuData).subscribe({
        next: (menuCreado) => {
          console.log('Menú creado:', menuCreado);
          // Si hay una imagen seleccionada, subirla
          if (this.selectedFile && menuCreado.id) {
            this.subirImagen(menuCreado.id).then(() => {
              alert('Menú creado exitosamente');
              this.cerrarModal();
              this.loadMenus();
            }).catch((error) => {
              console.error('Error al subir imagen:', error);
              alert('Menú creado pero hubo un error al subir la imagen');
              this.cerrarModal();
              this.loadMenus();
            });
          } else {
            alert('Menú creado exitosamente');
            this.cerrarModal();
            this.loadMenus();
          }
        },
        error: (err) => {
          console.error('Error completo al crear menú:', err);
          let mensaje = 'Error al crear el menú';
          if (err.status === 0) {
            mensaje = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
          } else if (err.error?.message) {
            mensaje = err.error.message;
          }
          alert(mensaje);
        }
      });
    }
  }

  eliminarMenu(id: number) {
    if (confirm('¿Está seguro de eliminar este menú?')) {
      this.menuService.eliminar(id).subscribe({
        next: () => {
          alert('Menú eliminado exitosamente');
          this.loadMenus();
        },
        error: (err) => console.error('Error al eliminar menú:', err)
      });
    }
  }

  // Métodos para Entregas
  marcarEntregado(reserva: any) {
    if (confirm(`¿Marcar como entregado el pedido de ${reserva.estudiante}?`)) {
      this.reservaService.actualizarEstado(reserva.id, 'RECOGIDO').subscribe({
        next: () => {
          alert('Pedido marcado como entregado');
          this.loadEntregas();
          this.loadDashboardData(); // Actualizar dashboard también
        },
        error: (err) => console.error('Error al actualizar estado:', err)
      });
    }
  }

  // Método para ver detalles de un pedido
  verDetalles(reservaId: number) {
    const reserva = this.reservasReales.find(r => r.id === reservaId);
    if (!reserva) {
      alert('No se encontró el pedido');
      return;
    }
    const cantidad = Number(reserva.cantidad) || 1;
    const total = Number(reserva.total) || 0;
    this.pedidoDetalle = {
      id: reserva.id,
      cliente: reserva.nombreCliente || reserva.usuario?.nombreCompleto || reserva.usuario?.username || '—',
      usuarioId: reserva.usuario?.id,
      menu: reserva.menu?.nombre || '—',
      menuDescripcion: reserva.menu?.descripcion,
      cantidad,
      precioUnitario: Number(reserva.menu?.precio) || (cantidad ? total / cantidad : 0),
      total,
      estado: reserva.estado || 'PENDIENTE',
      metodoPago: reserva.metodoPago || '—',
      numeroOperacion: reserva.numeroOperacion || '—',
      fecha: reserva.fechaReserva,
      horario: reserva.menu?.horario || '—',
      tipo: reserva.tipo || 'Reserva'
    };
    this.showDetalleModal = true;
  }

  cerrarDetalleModal() {
    this.showDetalleModal = false;
    this.pedidoDetalle = null;
  }

  // Métodos para filtrar pedidos
  setFiltroPedidos(filtro: string) {
    this.filtroPedidos = filtro;
    this.actualizarReservasVisibles();
  }

  actualizarReservasVisibles(): void {
    this.reservasVisibles = this.getReservasFiltradas();
  }

  getReservasFiltradas(): any[] {
    let lista: any[];
    switch (this.filtroPedidos) {
      case 'pendientes':
        lista = this.reservasReales.filter(r => this.esPendiente(r.estado));
        break;
      case 'completadas':
        lista = this.reservasReales.filter(r => this.normalizarEstado(r.estado) === 'RECOGIDO');
        break;
      case 'canceladas':
        lista = this.reservasReales.filter(r => this.normalizarEstado(r.estado) === 'CANCELADO');
        break;
      default:
        lista = this.reservasReales;
    }

    const term = (this.buscarPedidoTexto || '').trim().toLowerCase();
    if (!term) return lista;

    return lista.filter(r =>
      String(r.id).includes(term) ||
      String(r.usuario?.id || '').includes(term) ||
      (r.nombreCliente || '').toLowerCase().includes(term) ||
      (r.usuario?.nombreCompleto || '').toLowerCase().includes(term) ||
      (r.usuario?.username || '').toLowerCase().includes(term) ||
      (r.menu?.nombre || '').toLowerCase().includes(term)
    );
  }

  // Métodos para Boletas
  buscarPedidosUsuario() {
    const term = String(this.buscarUsuarioId ?? '').trim();
    if (!term) {
      alert('Ingresa # de reserva, nombre del cliente o ID de usuario');
      return;
    }

    const termLower = term.toLowerCase();
    const reservasLocales = this.reservasReales.filter(r =>
      String(r.id).includes(term) ||
      String(r.usuario?.id || '').includes(term) ||
      (r.nombreCliente || '').toLowerCase().includes(termLower) ||
      (r.usuario?.nombreCompleto || '').toLowerCase().includes(termLower)
    );

    if (reservasLocales.length > 0) {
      this.pedidosUsuario = reservasLocales.map(r => ({
        id: r.id,
        total: r.total,
        metodoPago: r.metodoPago || 'Reserva',
        creadoEn: r.fechaReserva,
        nombreCliente: r.nombreCliente || r.usuario?.nombreCompleto
      }));
      return;
    }

    const userId = Number(term);
    if (Number.isNaN(userId)) {
      alert('No se encontraron pedidos con ese criterio.');
      return;
    }

    this.pedidoService.listarPorUsuario(userId).subscribe({
      next: (data) => {
        this.pedidosUsuario = data || [];
        if (this.pedidosUsuario.length === 0) {
          alert('No se encontraron pedidos para ese ID de usuario.');
        }
      },
      error: (err) => {
        console.error('Error al buscar pedidos:', err);
        alert('No se encontraron pedidos para ese ID de usuario.');
      }
    });
  }

  generarBoleta() {
    if (this.pedidosUsuario.length === 0) {
      alert('No hay pedidos seleccionados para generar boleta');
      return;
    }

    const item = this.pedidosUsuario[0];
    const reserva = item.reserva || item;
    const menuId = reserva.menu?.id || item.menuId;

    if (!menuId) {
      alert('No se encontró el menú asociado al pedido.');
      return;
    }

    const dto = {
      codigoEstudiante: String(reserva.usuario?.username || reserva.usuario?.id || 'GUEST'),
      nombreEstudiante: reserva.nombreCliente || reserva.usuario?.nombreCompleto || 'Cliente',
      menuId,
      cantidad: reserva.cantidad || 1,
      metodoPago: reserva.metodoPago || item.metodoPago || 'Yape',
      pagadorNombre: reserva.nombreCliente || reserva.usuario?.nombreCompleto || 'Cliente',
      pagadorCuenta: reserva.numeroOperacion || '',
      monto: reserva.total || item.total
    };

    this.boletaService.generar(dto).subscribe({
      next: (boleta) => {
        alert(`Boleta generada: ${boleta.numero}`);
        this.pedidosUsuario = [];
        this.buscarUsuarioId = null;
        this.cargarBoletasVendedor();
        this.cargarReservasVendedor();
      },
      error: (err) => {
        console.error('Error al generar boleta:', err);
        alert('Error al generar la boleta. Si ya existe, revisa la lista de boletas.');
      }
    });
  }

  // Método para calcular el total de pedidos
  calcularTotalPedidos(): number {
    return this.totalPedidos;
  }

  calcularTotalVentasHoy(): number {
    return this.ventasHoy;
  }

  calcularPorcentajeCambio(): number {
    // En una implementación real, compararíamos con los datos de ayer
    // Por ahora, devolvemos un valor de ejemplo
    return 15;
  }

  calcularTotalReservasHoy(): number {
    return this.reservasHoy;
  }

  private esFechaHoy(fecha: unknown): boolean {
    return this.extraerFechaLocal(fecha) === this.fechaLocalHoy();
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

  calcularBecasActivasHoy(): number {
    if (!this.reservasReales || this.reservasReales.length === 0) return 0;
    
    return this.reservasReales.filter(r => r.tipo === 'Beca').length;
  }

  calcularMenusMasVendidos(reservas: any[]): void {
    if (!reservas || reservas.length === 0) {
      this.menusMasVendidos = [];
      return;
    }
    
    // Contar ventas por menú
    const ventasPorMenu: {[key: string]: {count: number, total: number, nombre: string}} = {};
    
    reservas.forEach(reserva => {
      if (reserva.menu && reserva.estado === 'RECOGIDO') {
        const menuId = reserva.menu.id;
        if (!ventasPorMenu[menuId]) {
          ventasPorMenu[menuId] = {
            count: 0,
            total: 0,
            nombre: reserva.menu.nombre || 'Menú desconocido'
          };
        }
        ventasPorMenu[menuId].count += 1;
        ventasPorMenu[menuId].total += reserva.total || 0;
      }
    });
    
    // Convertir a array y ordenar por cantidad de ventas
    this.menusMasVendidos = Object.values(ventasPorMenu)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((menu: any) => ({
        nombre: menu.nombre,
        vendidos: menu.count,
        total: menu.total
      }));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}