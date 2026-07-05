import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockAuthService.getCurrentUser.and.returnValue({ rol: 'ADMIN' });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should redirect to login if user is not admin', () => {
    mockAuthService.getCurrentUser.and.returnValue({ rol: 'CLIENTE' });
    fixture.detectChanges();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should change tab correctly', () => {
    mockAuthService.getCurrentUser.and.returnValue({ rol: 'ADMIN' });
    fixture.detectChanges();
    component.cambiarTab('menus');
    expect(component.currentTab).toBe('menus');
  });

  it('should logout and navigate to login', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should open menu edit modal with correct data', () => {
    const menu = { id: 1, nombre: 'Test Menu', categoria: 'Almuerzo', precio: 10, stock: 5, publicado: true };
    component.abrirModalEditar(menu);
    expect(component.showMenuModal).toBe(true);
    expect(component.menuForm.nombre).toBe('Test Menu');
  });

  it('should not allow admin to create menus', () => {
    spyOn(window, 'alert');
    component.menuForm = { nombre: 'New Menu', categoria: 'Almuerzo', precio: 15, stock: 10, publicado: true } as any;
    component.guardarMenu();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should update an existing menu', () => {
    mockAuthService.getCurrentUser.and.returnValue({ rol: 'ADMIN' });
    fixture.detectChanges();
    
    const menuToUpdate = component.menus[0];
    component.abrirModalEditar(menuToUpdate);
    component.menuForm.nombre = 'Updated Menu';
    component.guardarMenu();
    
    expect(component.menus[0].nombre).toBe('Updated Menu');
  });

  it('should delete a menu', () => {
    mockAuthService.getCurrentUser.and.returnValue({ rol: 'ADMIN' });
    fixture.detectChanges();
    
    const initialLength = component.menus.length;
    spyOn(window, 'confirm').and.returnValue(true);
    component.eliminarMenu(component.menus[0].id!);
    
    expect(component.menus.length).toBe(initialLength - 1);
  });
});