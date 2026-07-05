import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';
import { MockMenuService } from '../services/mock-menu.service';
import { PedidoService } from '../services/pedido.service';
import { ReservaService } from '../services/reserva.service';
import { ConfigService, ComedorConfig } from '../services/config.service';
import { DashboardService as ClienteDashboardService } from '../services/dashboard/dashboard';

interface Menu {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  stock?: number;
  disponibleDesde?: string;
  disponibleHasta?: string;
  imagenUrl?: string;
  publicado?: boolean;
}

interface Reserva {
  id?: number;
  menu?: Menu;
  horario?: string;
  fechaReserva?: string;
  estado?: string;
  metodoPago?: string;
  numeroOperacion?: string;
  nombreCliente?: string;
  total?: number;
  cantidad?: number;
}

interface CartItem {
  menu: Menu;
  cantidad: number;
  extras: Extra[];
  comentarios: string;
  nombreCliente?: string;
}

interface Extra {
  id: number;
  nombre: string;
  precio: number;
}

interface HistorialItem {
  fecha: string;
  menu: string;
  metodo: string;
  monto: number;
  estado: string;
  boleta: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  readonly API_URL = 'http://localhost:8080';

  // Método para construir URLs de imágenes
  getImageUrl(imagenUrl: string | undefined): string {
    console.log('Procesando imagen URL:', imagenUrl);
    
    // For guest mode or when there's no image, return a local placeholder
    if (!imagenUrl || imagenUrl === 'null' || imagenUrl === 'undefined' || imagenUrl.trim() === '') {
      console.log('Usando placeholder local para imagen (no URL)');
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+TWVuw7ogZGVsIGTDrWE8L3RleHQ+PC9zdmc+';
    }
    
    // Trim whitespace
    imagenUrl = imagenUrl.trim();
    
    // For backend images, try to load them directly
    // If the backend requires authentication, this might fail
    // In that case, we rely on the onImageError handler
    if (imagenUrl.startsWith('http')) {
      console.log('Usando URL completa para imagen:', imagenUrl);
      return imagenUrl; // Already a full URL
    }
    
    // For relative URLs, prepend the API URL
    // Make sure the URL starts with a slash
    if (!imagenUrl.startsWith('/')) {
      imagenUrl = '/' + imagenUrl;
    }
    
    const fullUrl = `${this.API_URL}${imagenUrl}`;
    console.log('Construyendo URL completa para imagen:', fullUrl);
    return fullUrl;
  }
  
  // Método para manejar errores de carga de imágenes
  onImageError(event: any): void {
    console.log('Error loading image:', event);
    console.log('Target element:', event.target);
    console.log('Current src:', event.target.src);
    
    // Use a local placeholder instead of external one that might fail
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+SW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
    
    // Prevent infinite loop
    event.target.onerror = null;
  }

  currentUser: any = null;
  currentTab: string = 'inicio'; // inicio, reservar, carrito, misreservas, historial
  
  // Datos de Inicio
  reservasActivas: number = 0;
  saldoGastado: number = 0;
  proximasReservas: Reserva[] = [];
  menusHoy: Menu[] = [];
  
  // Datos de Reservar
  menusDisponibles: Menu[] = [];
  fechaSeleccionada: string = 'Hoy';
  horarioSeleccionado: string = 'Todos';
  
  // Carrito
  carrito: CartItem[] = [];
  planSeleccionado: string = 'individual'; // individual, semanal, mensual
  
  // Propiedad computada para el total del carrito
  get totalCarrito(): number {
    let total = 0;
    this.carrito.forEach(item => {
      total += item.menu.precio * item.cantidad;
      item.extras.forEach(extra => {
        total += extra.precio * item.cantidad;
      });
    });
    
    // Aplicar descuentos por plan
    if (this.planSeleccionado === 'semanal') {
      total *= 0.9; // 10% descuento
    } else if (this.planSeleccionado === 'mensual') {
      total *= 0.8; // 20% descuento
    }
    
    return total;
  }
  
  // Método para calcular el subtotal sin descuento
  calcularSubtotalSinDescuento(): number {
    let subtotal = 0;
    this.carrito.forEach(item => {
      subtotal += item.menu.precio * item.cantidad;
      item.extras.forEach(extra => {
        subtotal += extra.precio * item.cantidad;
      });
    });
    return subtotal;
  }
  
  // Método para calcular el descuento aplicado
  calcularDescuento(): number {
    const subtotal = this.calcularSubtotalSinDescuento();
    let totalConDescuento = subtotal;
    
    // Aplicar descuentos por plan
    if (this.planSeleccionado === 'semanal') {
      totalConDescuento = subtotal * 0.9; // 10% descuento
    } else if (this.planSeleccionado === 'mensual') {
      totalConDescuento = subtotal * 0.8; // 20% descuento
    }
    
    return subtotal - totalConDescuento;
  }
  
  // Modal de Confirmar Reserva
  showReservaModal: boolean = false;
  menuSeleccionado: Menu | null = null;
  cantidadReserva: number = 1;
  extrasDisponibles: Extra[] = [
    { id: 1, nombre: 'Porción extra de arroz', precio: 1.50 },
    { id: 2, nombre: 'Ensalada adicional', precio: 2.00 },
    { id: 3, nombre: 'Jugo natural grande', precio: 2.50 },
    { id: 4, nombre: 'Postre del día', precio: 3.00 }
  ];
  extrasSeleccionados: number[] = [];
  comentariosReserva: string = '';
  nombreClienteReserva: string = '';
  
  // Propiedad computada para el subtotal
  get subtotal(): number {
    if (!this.menuSeleccionado) return 0;
    let subtotal = this.menuSeleccionado.precio * this.cantidadReserva;
    this.extrasSeleccionados.forEach(extraId => {
      const extra = this.extrasDisponibles.find(e => e.id === extraId);
      if (extra) subtotal += extra.precio * this.cantidadReserva;
    });
    
    // Aplicar descuentos por plan si es una reserva directa
    if (this.planSeleccionado === 'semanal') {
      subtotal *= 0.9; // 10% descuento
    } else if (this.planSeleccionado === 'mensual') {
      subtotal *= 0.8; // 20% descuento
    }
    
    return subtotal;
  };
  
  // Método para calcular el total de extras seleccionados
  calcularTotalExtras(): number {
    if (!this.menuSeleccionado) return 0;
    let totalExtras = 0;
    this.extrasSeleccionados.forEach(extraId => {
      const extra = this.extrasDisponibles.find(e => e.id === extraId);
      if (extra) totalExtras += extra.precio * this.cantidadReserva;
    });
    return totalExtras;
  }
  
  // Método para calcular el descuento en una reserva directa
  calcularDescuentoReserva(): number {
    if (!this.menuSeleccionado || this.planSeleccionado === 'individual') return 0;
    
    const subtotalSinDescuento = this.menuSeleccionado.precio * this.cantidadReserva;
    const totalExtras = this.calcularTotalExtras();
    const totalSinDescuento = subtotalSinDescuento + totalExtras;
    
    let totalConDescuento = totalSinDescuento;
    if (this.planSeleccionado === 'semanal') {
      totalConDescuento = totalSinDescuento * 0.9; // 10% descuento
    } else if (this.planSeleccionado === 'mensual') {
      totalConDescuento = totalSinDescuento * 0.8; // 20% descuento
    }
    
    return totalSinDescuento - totalConDescuento;
  }
  
  // Propiedad computada para el total con descuento aplicado
  get totalConDescuento(): number {
    // Si estamos en el carrito, usamos el total del carrito
    if (this.carrito.length > 0) {
      return this.totalCarrito;
    }
    // Si es una reserva directa, usamos el subtotal con descuento
    if (this.menuSeleccionado) {
      return this.subtotal;
    }
    // Si no hay nada seleccionado, devolvemos 0
    return 0;
  }

  get menusFiltrados(): Menu[] {
    const fechaObjetivo = this.fechaSeleccionada === 'Mañana'
      ? this.fechaManana()
      : this.fechaLocalHoy();

    let lista = this.menusDisponibles.filter(m => m.publicado !== false);

    lista = lista.filter(m => {
      const fm = (m as any).fechaMenu;
      if (!fm) return true;
      return String(fm).substring(0, 10) === fechaObjetivo;
    });

    if (this.horarioSeleccionado && this.horarioSeleccionado !== 'Todos') {
      return lista.filter(m =>
        (m.categoria || (m as any).horario || '').toLowerCase()
          .includes(this.horarioSeleccionado.toLowerCase())
      );
    }

    return lista;
  }

  private fechaLocalHoy(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private fechaManana(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private esInvitado(): boolean {
    return !this.currentUser?.id;
  }

  private guardarReservaInvitado(reservaId: number, nombreCliente?: string): void {
    if (!reservaId) return;
    try {
      const ids: number[] = JSON.parse(localStorage.getItem('guestReservaIds') || '[]');
      if (!ids.includes(reservaId)) {
        ids.push(reservaId);
        localStorage.setItem('guestReservaIds', JSON.stringify(ids));
      }
      const nombre = (nombreCliente || '').trim();
      if (nombre) {
        localStorage.setItem('guestNombreCliente', nombre);
      }
    } catch (e) {
      console.error('Error guardando reserva de invitado:', e);
    }
  }
  
  // Método para obtener el total de la reserva actual (directa o carrito)
  getTotalReservaActual(): number {
    // Si se abrió desde el modal de reserva directa
    if (this.menuSeleccionado && this.showReservaModal === false) {
      return this.subtotal;
    }
    // Si se abrió desde el carrito
    if (this.carrito.length > 0) {
      return this.totalCarrito;
    }
    return 0;
  }
  
  // Modal de Método de Pago
  showPagoModal: boolean = false;
  metodoPagoSeleccionado: string = 'Yape';
  numeroOperacion: string = '';
  
  // Modal de Confirmación
  showConfirmacionModal: boolean = false;
  ordenConfirmada: any = null;
  
  // Mis Reservas
  totalReservas: number = 0;
  reservasPendientes: number = 0;
  reservasCompletadas: number = 0;
  reservasCanceladas: number = 0;
  misReservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  filtroReservas: string = 'pendientes'; // pendientes, completadas, canceladas
  showBoletaModal: boolean = false;
  boletaSeleccionada: any = null;
  
  // Historial
  totalGastado: number = 0;
  ticketPromedio: number = 0;
  totalTransacciones: number = 0;
  historial: HistorialItem[] = [];
  periodoHistorial: string = 'Este Mes';

  comedorConfig: ComedorConfig = {
    nombreComedor: 'Comedor UPeU',
    horario: '07:00 - 20:00',
    direccion: '',
    logoUrl: ''
  };
  private configSub?: Subscription;

  constructor(
    private authService: AuthService,
    private menuService: MenuService,
    private mockMenuService: MockMenuService,
    private pedidoService: PedidoService,
    private reservaService: ReservaService,
    private clienteDashboardService: ClienteDashboardService,
    private router: Router,
    private configService: ConfigService
  ) {}

  get nombreUsuario(): string {
    return this.currentUser?.nombre
      || this.currentUser?.nombreCompleto
      || 'Invitado';
  }

  get codigoUsuario(): string {
    return this.currentUser?.codigo
      || this.currentUser?.username
      || 'GUEST';
  }

  normalizarMenu(menu: any): Menu {
    const normalizado = this.mockMenuService.normalizarMenu(menu);
    return {
      ...normalizado,
      stock: menu.disponibles ?? normalizado.stock ?? 0,
      disponibleDesde: menu.horaInicio || normalizado.disponibleDesde,
      disponibleHasta: menu.horaFin || normalizado.disponibleHasta,
      categoria: menu.horario || normalizado.categoria,
      fechaMenu: menu.fechaMenu,
      publicado: menu.publicado ?? true
    } as Menu;
  }

  aplicarMenus(menus: any[]) {
    const normalizados = menus.map(m => this.normalizarMenu(m));
    this.menusDisponibles = normalizados;
    this.menusHoy = normalizados.slice(0, 3);
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.comedorConfig = this.configService.getConfig();
    this.configSub = this.configService.config$.subscribe(cfg => {
      this.comedorConfig = cfg;
    });

    if (this.currentUser?.rol === 'VENDEDOR') {
      this.router.navigate(['/vendedor']);
      return;
    }
    if (this.currentUser?.rol === 'ADMIN') {
      this.router.navigate(['/admin']);
      return;
    }

    if (!this.currentUser) {
      this.currentUser = { id: null, nombre: 'Invitado', codigo: 'GUEST', username: 'invitado' };
    } else {
      localStorage.removeItem('guestReservations');
    }
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargarMenusDisponibles();
    this.cargarReservas();
    if (this.currentUser?.id) {
      this.cargarDashboardInicio();
    }
  }

  cargarDashboardInicio() {
    this.clienteDashboardService.obtenerDashboard(this.currentUser.id).subscribe({
      next: (response) => {
        const data = response?.data ?? response;
        if (!data) return;

        this.reservasActivas = data.reservasActivas ?? this.reservasActivas;
        if (data.saldoGastado != null) {
          this.saldoGastado = Math.max(this.saldoGastado, data.saldoGastado);
        }

        if (Array.isArray(data.proximasReservas)) {
          this.proximasReservas = data.proximasReservas.map((r: any) => ({
            ...r,
            estado: (r.estado || 'PENDIENTE').toString().toUpperCase()
          }));
        }

        if (Array.isArray(data.menusHoy) && data.menusHoy.length > 0) {
          this.menusHoy = data.menusHoy.map((m: any) => this.normalizarMenu(m));
        }
      },
      error: (err) => console.error('Error al cargar dashboard:', err)
    });
  }

  cargarMenusDisponibles() {
    this.menuService.listarPublicados().subscribe({
      next: (data) => {
        const menus = Array.isArray(data) ? data : [];
        if (menus.length > 0) {
          this.aplicarMenus(menus);
          return;
        }
        this.cargarMenusDesdeTodos();
      },
      error: (err) => {
        console.error('Error al cargar menús publicados:', err);
        this.cargarMenusDesdeTodos();
      }
    });
  }

  private cargarMenusDesdeTodos() {
    this.menuService.listarTodos().subscribe({
      next: (all) => {
        const publicados = (all || []).filter((m: any) => m.publicado !== false);
        if (publicados.length > 0) {
          this.aplicarMenus(publicados);
        } else {
          this.mockMenuService.listarPublicados().subscribe(menus => this.aplicarMenus(menus));
        }
      },
      error: () => {
        this.mockMenuService.listarPublicados().subscribe(menus => this.aplicarMenus(menus));
      }
    });
  }

  cargarReservas() {
    console.log('Cargando reservas. Usuario actual:', this.currentUser);
    
    if (this.currentUser && this.currentUser.id) {
      console.log('Cargando reservas para usuario autenticado:', this.currentUser.id);
      this.reservaService.listarPorUsuario(this.currentUser.id).subscribe({
        next: (data) => {
          console.log('Reservas cargadas para usuario:', data);
          console.log('Tipo de datos:', typeof data);
          console.log('Es array:', Array.isArray(data));
          
          // Log the structure of the first reservation if available
          if (data && Array.isArray(data) && data.length > 0) {
            console.log('Primera reserva:', data[0]);
            if (data[0].menu) {
              console.log('Menu de primera reserva:', data[0].menu);
              console.log('Imagen URL de menu de primera reserva:', data[0].menu.imagenUrl);
            }
          }
          
          // Check if data is valid
          if (data && Array.isArray(data)) {
            this.procesarReservas(data);
          } else {
            console.log('Datos de reservas inválidos, usando array vacío');
            this.procesarReservas([]);
          }
        },
        error: (err) => {
          console.error('Error al cargar reservas para usuario autenticado:', err);
          // Try to load from pedido service as fallback
          console.log('Intentando cargar reservas desde servicio de pedidos como fallback');
          this.pedidoService.listarPorUsuario(this.currentUser.id).subscribe({
            next: (data) => {
              console.log('Reservas cargadas desde servicio de pedidos:', data);
              if (data && Array.isArray(data)) {
                this.procesarReservas(data);
              } else {
                console.log('Datos de reservas inválidos desde servicio de pedidos, usando array vacío');
                this.procesarReservas([]);
              }
            },
            error: (err2) => {
              console.error('Error al cargar reservas desde servicio de pedidos:', err2);
              // Even on error, we should clear the filtered list to avoid showing stale data
              this.reservasFiltradas = [];
              this.actualizarEstadisticas();
            }
          });
        }
      });
    } else {
      console.log('Usuario no autenticado (modo invitado), cargando reservas del invitado');
      this.cargarReservasInvitado();
    }
  }

  private cargarReservasInvitado() {
    let ids: number[] = [];
    try {
      ids = JSON.parse(localStorage.getItem('guestReservaIds') || '[]');
    } catch {
      ids = [];
    }
    const nombreGuest = (localStorage.getItem('guestNombreCliente') || '').trim().toLowerCase();

    this.reservaService.listarTodas().subscribe({
      next: (todas) => {
        const delApi = (todas || []).filter((r: any) =>
          ids.includes(Number(r.id)) ||
          (nombreGuest && String(r.nombreCliente || '').toLowerCase() === nombreGuest)
        );

        if (delApi.length > 0) {
          this.procesarReservas(delApi);
          return;
        }

        const localReservations = localStorage.getItem('guestReservations');
        if (localReservations) {
          try {
            const reservations = JSON.parse(localReservations);
            if (Array.isArray(reservations) && reservations.length > 0) {
              this.procesarReservas(reservations);
              return;
            }
          } catch (e) {
            console.error('Error parsing local reservations:', e);
          }
        }

        this.procesarReservas([]);
      },
      error: () => {
        const localReservations = localStorage.getItem('guestReservations');
        if (localReservations) {
          try {
            this.procesarReservas(JSON.parse(localReservations));
          } catch {
            this.procesarReservas([]);
          }
        } else {
          this.procesarReservas([]);
        }
      }
    });
  }
  
  procesarReservas(data: any[]) {
    console.log('Procesando reservas. Datos recibidos:', data);
    this.misReservas = data || [];
    
    // Log each reservation with its status and menu data
    this.misReservas.forEach((reserva, index) => {
      console.log(`Reserva ${index}: ID=${reserva.id}, Estado=${reserva.estado}, Fecha=${reserva.fechaReserva}`);
      console.log(`Reserva ${index} completa:`, reserva);
      
      // Check menu data
      if (reserva.menu) {
        console.log(`Reserva ${index} menu:`, reserva.menu);
        console.log(`Reserva ${index} menu imagenUrl:`, reserva.menu.imagenUrl);
      } else {
        console.log(`Reserva ${index} no tiene datos de menú`);
      }
      
      // Check if reserva has the expected structure
      if (!reserva.hasOwnProperty('estado')) {
        console.warn(`Reserva ${index} no tiene propiedad 'estado'`);
      }
    });
    
    // Make sure each reservation has the expected structure
    this.misReservas = this.misReservas.map(reserva => {
      // Ensure reserva has all required properties
      const normalizedReserva = {
        ...reserva,
        id: reserva.id || Date.now() + Math.random(),
        cantidad: reserva.cantidad || 1,
        total: reserva.total || (reserva.menu?.precio ? reserva.menu.precio * (reserva.cantidad || 1) : 0),
        estado: (reserva.estado || 'PENDIENTE').toUpperCase(),
        fechaReserva: reserva.fechaReserva || new Date().toISOString()
      };
      
      // If reserva doesn't have an estado field, set a default
      if (!reserva.hasOwnProperty('estado')) {
        console.log('Agregando estado predeterminado a reserva:', reserva);
        normalizedReserva.estado = 'PENDIENTE';
      }
      
      // Ensure estado is in uppercase
      if (normalizedReserva.estado && typeof normalizedReserva.estado === 'string') {
        normalizedReserva.estado = normalizedReserva.estado.toUpperCase();
      }
      
      return normalizedReserva;
    });
    
    this.proximasReservas = this.misReservas.filter((r: Reserva) => (r.estado || '') === 'PENDIENTE').slice(0, 3);
    
    // Update statistics
    this.actualizarEstadisticas();
    
    // Apply current filter
    this.filtrarReservas();
  }
  
  actualizarEstadisticas() {
    this.reservasActivas = this.misReservas.filter((r: Reserva) => {
      const estado = (r.estado || '').toUpperCase();
      return estado === 'PENDIENTE' || estado === 'PAGO_VERIFICADO';
    }).length;
    this.totalReservas = this.misReservas.length;
    this.reservasPendientes = this.reservasActivas;
    this.reservasCompletadas = this.misReservas.filter((r: Reserva) => (r.estado || '').toUpperCase() === 'RECOGIDO').length;
    this.reservasCanceladas = this.misReservas.filter((r: Reserva) => (r.estado || '').toUpperCase() === 'CANCELADO').length;

    const ahora = new Date();
    this.saldoGastado = this.misReservas
      .filter((r: Reserva) => {
        if (!r.fechaReserva) return false;
        const fecha = new Date(r.fechaReserva);
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      })
      .reduce((sum, r) => sum + (r.total || (r.menu?.precio || 0) * (r.cantidad || 1)), 0);

    this.cargarHistorial();
  }
  
  filtrarReservas() {
    console.log('Filtrando reservas. Filtro actual:', this.filtroReservas);
    console.log('Todas las reservas:', this.misReservas);
    
    switch (this.filtroReservas) {
      case 'pendientes':
        this.reservasFiltradas = this.misReservas.filter((r: Reserva) => {
          const estado = (r.estado || '').toUpperCase(); // Handle undefined estado and normalize to uppercase
          const isPending = estado === 'PENDIENTE' || estado === 'PAGO_VERIFICADO';
          console.log(`Reserva ${r.id} - Estado: ${estado}, Es pendiente: ${isPending}`);
          return isPending;
        });
        break;
      case 'completadas':
        this.reservasFiltradas = this.misReservas.filter((r: Reserva) => {
          const estado = (r.estado || '').toUpperCase(); // Handle undefined estado and normalize to uppercase
          const isCompleted = estado === 'RECOGIDO';
          console.log(`Reserva ${r.id} - Estado: ${estado}, Es completada: ${isCompleted}`);
          return isCompleted;
        });
        break;
      case 'canceladas':
        this.reservasFiltradas = this.misReservas.filter((r: Reserva) => {
          const estado = (r.estado || '').toUpperCase(); // Handle undefined estado and normalize to uppercase
          const isCancelled = estado === 'CANCELADO';
          console.log(`Reserva ${r.id} - Estado: ${estado}, Es cancelada: ${isCancelled}`);
          return isCancelled;
        });
        break;
      default:
        // Default to showing pending reservations if filter doesn't match
        this.reservasFiltradas = this.misReservas.filter((r: Reserva) => {
          const estado = (r.estado || '').toUpperCase(); // Handle undefined estado and normalize to uppercase
          return estado === 'PENDIENTE' || estado === 'PAGO_VERIFICADO';
        });
    }
    
    console.log('Reservas filtradas resultantes:', this.reservasFiltradas);
  }
  
  cambiarFiltroReservas(filtro: string) {
    console.log('Cambiando filtro de reservas de', this.filtroReservas, 'a', filtro);
    this.filtroReservas = filtro;
    this.filtrarReservas();
  }

  cargarHistorial() {
    // Use real data from reservations instead of hardcoded examples
    if (this.misReservas && this.misReservas.length > 0) {
      // Convert reservations to history items
      this.historial = this.misReservas.map(reserva => {
        return {
          fecha: reserva.fechaReserva ? new Date(reserva.fechaReserva).toLocaleDateString('es-PE') : 'Fecha no disponible',
          menu: reserva.menu?.nombre || 'Menú no especificado',
          metodo: reserva.metodoPago || 'Método no especificado',
          monto: reserva.total || (reserva.menu?.precio || 0) * (reserva.cantidad || 1),
          estado: reserva.estado === 'RECOGIDO' ? 'Completado' : 
                  reserva.estado === 'CANCELADO' ? 'Cancelado' : 
                  reserva.estado || 'Pendiente',
          boleta: `B001-${reserva.id || '000000'}`
        };
      });
      
      // Sort by date (most recent first)
      this.historial.sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Update statistics
      this.actualizarEstadisticasHistorial();
    } else {
      // If no reservations, use empty array or default message
      this.historial = [];
      this.actualizarEstadisticasHistorial();
    }
  }
  
  actualizarEstadisticasHistorial() {
    if (this.historial && this.historial.length > 0) {
      // Calculate total spent
      this.totalGastado = this.historial.reduce((sum, item) => sum + item.monto, 0);
      
      // Calculate average ticket
      this.ticketPromedio = this.totalGastado / this.historial.length;
      
      // Total transactions
      this.totalTransacciones = this.historial.length;
    } else {
      this.totalGastado = 0;
      this.ticketPromedio = 0;
      this.totalTransacciones = 0;
    }
  }

  cambiarTab(tab: string) {
    this.currentTab = tab;

    if (tab === 'inicio') {
      this.cargarMenusDisponibles();
      if (this.currentUser?.id) {
        this.cargarDashboardInicio();
      }
    }

    if (tab === 'reservar') {
      this.cargarMenusDisponibles();
    }

    if (tab === 'misreservas') {
      this.cargarReservas();
    }

    if (tab === 'historial') {
      this.cargarReservas();
      setTimeout(() => this.cargarHistorial(), 200);
    }
  }

  // Métodos de Reservar
  abrirModalReserva(menu: Menu) {
    this.menuSeleccionado = menu;
    this.cantidadReserva = 1;
    this.extrasSeleccionados = [];
    this.comentariosReserva = '';
    this.nombreClienteReserva = this.nombreUsuario !== 'Invitado' ? this.nombreUsuario : '';
    this.showReservaModal = true;
  }

  toggleExtra(extraId: number) {
    const index = this.extrasSeleccionados.indexOf(extraId);
    if (index > -1) {
      this.extrasSeleccionados.splice(index, 1);
    } else {
      this.extrasSeleccionados.push(extraId);
    }
  }

  calcularSubtotal(): number {
    return this.subtotal;
  }

  agregarAlCarrito() {
    if (!this.menuSeleccionado) return;
    if (!this.validarNombreClienteParaPago()) return;
    
    const extras = this.extrasDisponibles.filter(e => this.extrasSeleccionados.includes(e.id));
    
    this.carrito.push({
      menu: this.menuSeleccionado,
      cantidad: this.cantidadReserva,
      extras: extras,
      comentarios: this.comentariosReserva,
      nombreCliente: this.nombreClienteReserva.trim()
    });
    
    this.cerrarModalReserva();
    alert('Agregado al carrito');
    
    // Automatically navigate to the cart tab
    this.cambiarTab('carrito');
  }

  reservarDirecto() {
    if (!this.menuSeleccionado) return;
    this.showReservaModal = false;
    this.showPagoModal = true;
  }

  confirmarPedidoDirecto() {
    if (!this.validarNombreClienteParaPago()) return;
    this.reservarDirecto();
  }

  cerrarModalReserva() {
    this.showReservaModal = false;
    this.menuSeleccionado = null;
    this.cantidadReserva = 1;
    this.extrasSeleccionados = [];
    this.comentariosReserva = '';
    this.nombreClienteReserva = '';
  }

  private construirDtoReserva(
    menuId: number | undefined,
    cantidad: number,
    extrasIds: number[],
    comentarios: string,
    nombreCliente?: string
  ): any {
    const dto: any = {
      menuId,
      cantidad: cantidad || 1,
      extrasIds: extrasIds || [],
      metodoPago: this.metodoPagoSeleccionado || 'Yape',
      comentarios: comentarios || '',
      numeroOperacion: this.numeroOperacion || '',
      nombreCliente: (nombreCliente || this.nombreClienteReserva || this.nombreUsuario || '').trim()
    };
    if (this.currentUser?.id) {
      dto.usuarioId = this.currentUser.id;
    }
    return dto;
  }

  private validarNombreCliente(): boolean {
    const nombre = (this.nombreClienteReserva || '').trim();
    if (!nombre) {
      alert('Ingresa el nombre del cliente o estudiante que recogerá el menú.');
      return false;
    }
    return true;
  }

  private validarNombreClienteParaPago(): boolean {
    if (this.carrito.length > 0) {
      const faltaNombre = this.carrito.some(item => !(item.nombreCliente || '').trim());
      if (faltaNombre) {
        alert('Uno o más items del carrito no tienen nombre de cliente.');
        return false;
      }
      return true;
    }
    return this.validarNombreCliente();
  }

  // Métodos de Carrito
  calcularTotalCarrito(): number {
    return this.totalCarrito;
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
  }

  aumentarCantidad(item: CartItem) {
    item.cantidad++;
  }

  disminuirCantidad(item: CartItem) {
    if (item.cantidad > 1) {
      item.cantidad--;
    }
  }

  procederAlPago() {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    // For cart payments, we need to send each item separately or as a batch
    // For now, we'll show the payment modal and handle the cart items in confirmarPago
    this.showPagoModal = true;
  }
  
  // Método para obtener todos los extras IDs del carrito
  obtenerExtrasIdsDelCarrito(): number[] {
    const extrasIds: number[] = [];
    this.carrito.forEach(item => {
      item.extras.forEach(extra => {
        if (!extrasIds.includes(extra.id)) {
          extrasIds.push(extra.id);
        }
      });
    });
    return extrasIds;
  }
  
  // Método para calcular la cantidad total de items en el carrito
  calcularCantidadTotalCarrito(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }

  // Métodos de Pago
  confirmarPago() {
    if (!this.numeroOperacion) {
      alert('Ingrese el número de operación');
      return;
    }
    if (!this.validarNombreClienteParaPago()) return;

    // Si hay elementos en el carrito, procesarlos todos
    if (this.carrito.length > 0) {
      this.procesarCarritoCompleto();
      return;
    }

    // Si es una reserva directa
    if (this.menuSeleccionado) {
      this.procesarReservaDirecta();
      return;
    }

    alert('No hay items para reservar. Por favor, seleccione un menú o agregue items al carrito.');
  }

  // Procesar todos los items del carrito
  procesarCarritoCompleto() {
    let itemsProcesados = 0;
    const totalItems = this.carrito.length;
    const errores: string[] = [];

    // Procesar cada item del carrito
    this.carrito.forEach((item, index) => {
      const dto = this.construirDtoReserva(
        item.menu?.id,
        item.cantidad || 1,
        item.extras.map(extra => extra.id) || [],
        item.comentarios || '',
        item.nombreCliente
      );

      // Validar que el menuId esté presente
      if (!dto.menuId) {
        errores.push(`Item ${index + 1}: No tiene un menú válido`);
        itemsProcesados++;
        return;
      }

      console.log(`Sending reservation data for item ${index + 1}:`, JSON.stringify(dto, null, 2));
      console.log('DTO keys:', Object.keys(dto));
      console.log('DTO values:', Object.values(dto));

      this.pedidoService.confirmarReserva(dto).subscribe({
        next: (response) => {
          itemsProcesados++;
          if (this.esInvitado() && response?.reservaId) {
            this.guardarReservaInvitado(Number(response.reservaId), dto.nombreCliente);
          }

          if (itemsProcesados === totalItems) {
            this.finalizarProcesoCarrito(errores);
          }
        },
        error: (err) => {
          console.error(`Error al confirmar item ${index + 1}:`, err);
          console.error('Error completo:', JSON.stringify(err, null, 2));
          
          // Extraer el mensaje de error del backend
          let errorMessage = 'Error desconocido';
          if (err.error) {
            if (typeof err.error === 'string') {
              errorMessage = err.error;
            } else if (err.error.error) {
              errorMessage = err.error.error;
            } else if (err.error.message) {
              errorMessage = err.error.message;
            }
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          errores.push(`Item ${index + 1}: ${errorMessage}`);
          itemsProcesados++;

          // Si es el último item procesado
          if (itemsProcesados === totalItems) {
            this.finalizarProcesoCarrito(errores);
          }
        }
      });
    });
  }
  
  // Procesar carrito para usuarios invitados (guardar localmente)
  procesarCarritoParaInvitado() {
    console.log('Procesando carrito para usuario invitado');
    
    // Create reservation objects from cart items
    const localReservations: any[] = [];
    
    // Get existing local reservations
    const existingLocalReservations = localStorage.getItem('guestReservations');
    if (existingLocalReservations) {
      try {
        const existingReservations = JSON.parse(existingLocalReservations);
        localReservations.push(...existingReservations);
        console.log('Reservas locales existentes:', existingReservations);
      } catch (e) {
        console.error('Error parsing existing local reservations:', e);
      }
    }
    
    // Convert cart items to reservation objects
    this.carrito.forEach((item, index) => {
      const itemTotal = item.menu.precio * item.cantidad +
        item.extras.reduce((sum, e) => sum + e.precio * item.cantidad, 0);

      const reservation = {
        id: Date.now() + index,
        menu: item.menu,
        cantidad: item.cantidad,
        total: itemTotal,
        metodoPago: this.metodoPagoSeleccionado || 'Yape',
        numeroOperacion: this.numeroOperacion || '',
        comentarios: item.comentarios || '',
        estado: 'PENDIENTE',
        fechaReserva: new Date().toISOString()
      };
      
      localReservations.push(reservation);
      console.log('Agregando reserva local para item del carrito:', reservation);
    });
    
    // Save to localStorage
    try {
      localStorage.setItem('guestReservations', JSON.stringify(localReservations));
      console.log('Reservas del carrito guardadas localmente para usuario invitado. Total:', localReservations.length);
    } catch (e) {
      console.error('Error saving cart reservations locally:', e);
    }
    
    // Clear cart and show confirmation
    this.carrito = [];
    this.numeroOperacion = '';
    
    this.ordenConfirmada = {
      numero: '#' + Date.now(),
      plan: this.planSeleccionado === 'individual' ? 'Individual' : 
            this.planSeleccionado === 'semanal' ? 'Semanal' : 'Mensual',
      total: this.totalCarrito
    };
    
    this.showPagoModal = false;
    this.showConfirmacionModal = true;
    
    // Reload reservations and navigate to misreservas
    setTimeout(() => {
      this.cargarReservas();
      this.cambiarTab('misreservas');
      
      // Show receipt for the latest reservation
      setTimeout(() => {
        if (this.misReservas && this.misReservas.length > 0) {
          const latestReservation = this.misReservas[this.misReservas.length - 1];
          this.verBoleta(latestReservation);
        }
      }, 500);
    }, 1000);
  }

  // Finalizar proceso del carrito
  finalizarProcesoCarrito(errores: string[]) {
    if (errores.length > 0) {
      alert('Algunos items no se pudieron procesar:\n' + errores.join('\n'));
    }

    this.ordenConfirmada = {
      numero: '#' + Date.now(),
      plan: this.planSeleccionado === 'individual' ? 'Individual' : 
            this.planSeleccionado === 'semanal' ? 'Semanal' : 'Mensual',
      total: this.totalCarrito
    };
    
    this.showPagoModal = false;
    this.showConfirmacionModal = true;
    
    // Limpiar el carrito completamente
    this.carrito = [];
    this.numeroOperacion = '';
    
    // For guest users, we need to save the reservations locally
    if (!this.currentUser || !this.currentUser.id) {
      console.log('Guardando reservas del carrito localmente para usuario invitado');
      // In a real implementation, we would need to create reservation objects from the cart items
      // For now, we'll just reload reservations which should trigger the localStorage check
    }
    
    // For guest users, we would need to handle each reservation individually
    // For now, we'll just reload reservations
    console.log('Recargando reservas después de procesar carrito');
    // Add a delay to ensure the backend has time to process the reservations
    setTimeout(() => {
      this.cargarReservas();
    }, 500);
    
    // After a short delay, navigate to reservations and show the receipt
    setTimeout(() => {
      this.cambiarTab('misreservas');
      
      // After another delay, show the receipt for the latest reservation
      setTimeout(() => {
        if (this.misReservas && this.misReservas.length > 0) {
          // Get the most recent reservation
          const latestReservation = this.misReservas.reduce((latest, current) => {
            const latestDate = new Date(latest.fechaReserva || 0).getTime();
            const currentDate = new Date(current.fechaReserva || 0).getTime();
            return currentDate > latestDate ? current : latest;
          });
          
          this.verBoleta(latestReservation);
        }
      }, 1000);
    }, 1500);
  }

  // Procesar reserva directa (desde modal de confirmación)
  procesarReservaDirecta() {
    if (!this.validarNombreCliente()) return;

    const dto = this.construirDtoReserva(
      this.menuSeleccionado?.id,
      this.cantidadReserva || 1,
      this.extrasSeleccionados || [],
      this.comentariosReserva || ''
    );

    if (!dto.menuId) {
      alert('Error: No se ha seleccionado un menú válido.');
      return;
    }

    this.pedidoService.confirmarReserva(dto).subscribe({
      next: (response) => {
        const menuReservado = this.menuSeleccionado;

        if (this.esInvitado() && response?.reservaId) {
          this.guardarReservaInvitado(Number(response.reservaId), dto.nombreCliente);
        }

        this.ordenConfirmada = {
          numero: response.boletaNumero || response.id || '#000',
          reservaId: response.reservaId,
          plan: this.planSeleccionado === 'individual' ? 'Individual' :
                this.planSeleccionado === 'semanal' ? 'Semanal' : 'Mensual',
          total: response.total || this.subtotal
        };
        this.showPagoModal = false;
        this.showConfirmacionModal = true;
        this.numeroOperacion = '';
        this.menuSeleccionado = null;
        this.cantidadReserva = 1;
        this.extrasSeleccionados = [];
        this.comentariosReserva = '';

        this.handleNewReservation({
          ...response,
          id: response.reservaId,
          nombreCliente: dto.nombreCliente,
          menu: menuReservado,
          total: response.total || this.subtotal,
          estado: 'PENDIENTE',
          fechaReserva: new Date().toISOString()
        });

        setTimeout(() => {
          this.cambiarTab('misreservas');
          setTimeout(() => {
            if (this.misReservas?.length > 0) {
              const latest = this.misReservas.reduce((a, b) =>
                new Date(b.fechaReserva || 0).getTime() > new Date(a.fechaReserva || 0).getTime() ? b : a
              );
              this.verBoleta(latest);
            }
          }, 1000);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al confirmar pedido:', err);
        console.error('Error completo:', JSON.stringify(err, null, 2));
        
        // Extraer el mensaje de error del backend
        let errorMessage = 'Error desconocido';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        if (err.status === 401) {
          alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          alert('Error al procesar el pago: ' + errorMessage);
        }
      }
    });
  }
  
  // Procesar reserva directa para usuarios invitados (guardar localmente)
  procesarReservaDirectaParaInvitado() {
    const menu = this.menuSeleccionado;
    if (!menu) return;

    const cantidad = this.cantidadReserva || 1;
    const totalReserva = this.subtotal;

    const reservation = {
      id: Date.now(),
      menu,
      cantidad,
      total: totalReserva,
      metodoPago: this.metodoPagoSeleccionado || 'Yape',
      numeroOperacion: this.numeroOperacion || '',
      comentarios: this.comentariosReserva || '',
      nombreCliente: this.nombreClienteReserva.trim(),
      estado: 'PENDIENTE',
      fechaReserva: new Date().toISOString()
    };
    
    // Get existing local reservations
    let localReservations: any[] = [];
    const existingLocalReservations = localStorage.getItem('guestReservations');
    if (existingLocalReservations) {
      try {
        localReservations = JSON.parse(existingLocalReservations);
        console.log('Reservas locales existentes:', localReservations);
      } catch (e) {
        console.error('Error parsing existing local reservations:', e);
        localReservations = [];
      }
    }
    
    // Add the new reservation
    localReservations.push(reservation);
    console.log('Agregando reserva local:', reservation);
    
    // Save to localStorage
    try {
      localStorage.setItem('guestReservations', JSON.stringify(localReservations));
      console.log('Reserva guardada localmente para usuario invitado. Total:', localReservations.length);
    } catch (e) {
      console.error('Error saving reservation locally:', e);
      alert('Error al guardar la reserva localmente');
      return;
    }
    
    // Clear form data
    this.menuSeleccionado = null;
    this.cantidadReserva = 1;
    this.extrasSeleccionados = [];
    this.comentariosReserva = '';
    this.numeroOperacion = '';
    
    // Show confirmation
    this.ordenConfirmada = {
      numero: '#' + reservation.id,
      plan: this.planSeleccionado === 'individual' ? 'Individual' :
            this.planSeleccionado === 'semanal' ? 'Semanal' : 'Mensual',
      total: totalReserva
    };
    
    this.showPagoModal = false;
    this.showConfirmacionModal = true;
    
    // Reload reservations and navigate to misreservas
    setTimeout(() => {
      this.cargarReservas();
      this.cambiarTab('misreservas');
      
      // Show receipt for the new reservation
      setTimeout(() => {
        if (this.misReservas && this.misReservas.length > 0) {
          const latestReservation = this.misReservas[this.misReservas.length - 1];
          this.verBoleta(latestReservation);
        }
      }, 500);
    }, 1000);
  }
  
  handleNewReservation(reservation: any) {
    console.log('Handling new reservation:', reservation);
    console.log('Tipo de reserva:', typeof reservation);
    console.log('Contenido de la reserva:', reservation);
    
    // Ensure the reservation has the expected structure
    const formattedReservation = {
      ...reservation,
      estado: reservation.estado || 'PENDIENTE', // Default to PENDIENTE if not set
      fechaReserva: reservation.fechaReserva || new Date().toISOString()
    };
    
    console.log('Reserva formateada:', formattedReservation);
    
    // Invitados: también guardar referencia local si vino del API
    if (!this.currentUser?.id) {
      if (reservation?.reservaId) {
        this.guardarReservaInvitado(Number(reservation.reservaId), reservation.nombreCliente);
      }
      let localReservations: any[] = [];
      const existingLocalReservations = localStorage.getItem('guestReservations');
      if (existingLocalReservations) {
        try {
          localReservations = JSON.parse(existingLocalReservations);
        } catch {
          localReservations = [];
        }
      }
      localReservations.push(formattedReservation);
      try {
        localStorage.setItem('guestReservations', JSON.stringify(localReservations));
      } catch (e) {
        console.error('Error saving reservation locally:', e);
      }
    }
    
    // Recargar las reservas para mostrar la nueva
    console.log('Recargando reservas después de confirmar reserva directa');
    // Add a delay to ensure the backend has time to process the reservation
    setTimeout(() => {
      this.cargarReservas();
    }, 500);
    
    // Also update history
    setTimeout(() => {
      this.cargarHistorial();
    }, 1000);
  }

  cerrarModalPago() {
    this.showPagoModal = false;
  }

  cerrarModalConfirmacion() {
    console.log('Cerrando modal de confirmación y cambiando a pestaña misreservas');
    this.showConfirmacionModal = false;
    this.cambiarTab('misreservas');
    // Ensure reservations are reloaded when navigating to misreservas
    console.log('Recargando reservas después de cerrar modal de confirmación');
    this.cargarReservas();
    
    // Automatically show the receipt for the latest reservation
    if (this.misReservas && this.misReservas.length > 0) {
      // Get the most recent reservation
      const latestReservation = this.misReservas.reduce((latest, current) => {
        const latestDate = new Date(latest.fechaReserva || 0).getTime();
        const currentDate = new Date(current.fechaReserva || 0).getTime();
        return currentDate > latestDate ? current : latest;
      });
      
      // Show the receipt after a short delay
      setTimeout(() => {
        this.verBoleta(latestReservation);
      }, 1000);
    }
    
    // Update history as well
    setTimeout(() => {
      this.cargarHistorial();
    }, 2000);
  }

  // Métodos de Mis Reservas
  // Método para ver detalles de un pedido
  verBoleta(reserva: Reserva) {
    // Calcular el subtotal correctamente
    let subtotal = 0;
    let extrasTotal = 0;
    
    if (reserva.menu) {
      subtotal = (reserva.menu.precio || 0) * (reserva.cantidad || 1);
      // Si tenemos información de extras, calcularlos
      // Por ahora usamos un valor predeterminado
    }
    
    const total = reserva.total || subtotal;

    this.boletaSeleccionada = {
      fecha: reserva.fechaReserva ? new Date(reserva.fechaReserva).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'),
      hora: reserva.fechaReserva ? new Date(reserva.fechaReserva).toLocaleTimeString('es-PE') : new Date().toLocaleTimeString('es-PE'),
      nombre: (reserva as any).nombreCliente || this.currentUser?.nombre || this.currentUser?.nombreCompleto || 'Cliente',
      dni: '12345678',
      codigo: this.currentUser.codigo || '3232',
      menu: reserva.menu?.nombre || 'Menú Ejecutivo',
      cantidad: reserva.cantidad || 1,
      precioUnitario: reserva.menu?.precio || 8.50,
      subtotal: subtotal,
      extras: extrasTotal,
      total: total,
      metodoPago: reserva.metodoPago || 'YAPE',
      numeroOperacion: reserva.numeroOperacion || this.numeroOperacion || '123456789',
      estado: reserva.estado || 'PAGADO',
      horario: reserva.menu?.disponibleDesde && reserva.menu?.disponibleHasta 
        ? `${reserva.menu.disponibleDesde} - ${reserva.menu.disponibleHasta}` 
        : '11:00 - 23:59'
    };
    this.showBoletaModal = true;
  }

  cerrarModalBoleta() {
    this.showBoletaModal = false;
  }

  imprimirBoleta() {
    window.print();
  }

  descargarBoleta(boleta: string) {
    alert(`Descargando boleta ${boleta}`);
  }

  logout() {
    this.authService.logout();
    // Clear guest reservations on logout
    localStorage.removeItem('guestReservations');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }
}
