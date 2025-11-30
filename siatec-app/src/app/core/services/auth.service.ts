import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { 
  User, 
  LoginCredentials, 
  AuthResponse, 
  CreateAccountData, 
  UpdateAccountData,
  PasswordRecoveryRequest,
  PasswordRecoveryResponse
} from '../models/auth.model';

/**
 * Servicio de autenticación para SIATEC
 * Maneja login, logout, tokens y estado del usuario
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'siatec.auth.token';
  private readonly USER_KEY = 'siatec.auth.user';
  private readonly CONTRIBUYENTE_ID_KEY = 'siatec.contribuyente.id';

  // Estado reactivo con signals
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  // Computed signals
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentUser = computed(() => this.userSignal());
  readonly contribuyenteId = computed(() => {
    const user = this.userSignal();
    if (!user) return null;
    return user.contribuyenteId || user.idContribuyente || user.id || null;
  });

  // BehaviorSubject para compatibilidad con RxJS
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Login de cuenta de contribuyente
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const url = `${this.config.getApiUrl('auth')}/CuentaContribuyente/login`;

    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Crear nueva cuenta de contribuyente
   */
  createAccount(data: CreateAccountData): Observable<AuthResponse> {
    const url = `${this.config.getApiUrl('auth')}/CuentaContribuyente`;

    return this.http.post<AuthResponse>(url, data).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Alias para createAccount (para compatibilidad)
   */
  register(data: CreateAccountData): Observable<AuthResponse> {
    return this.createAccount(data);
  }

  /**
   * Actualizar cuenta de contribuyente
   */
  updateAccount(data: UpdateAccountData): Observable<any> {
    const url = `${this.config.getApiUrl('auth')}/CuentaContribuyente`;

    return this.http.put(url, data).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Solicitud de recuperación de contraseña
   */
  requestPasswordRecovery(payload: PasswordRecoveryRequest): Observable<PasswordRecoveryResponse> {
    const url = `${this.config.getApiUrl('auth')}/CuentaContribuyente/password/recovery`;
    const body = {
      email: payload.email,
      identifier: payload.identifier,
      channel: payload.contactPreference || 'email'
    };

    return this.http.post<PasswordRecoveryResponse>(url, body).pipe(
      map(response => response || { message: 'Solicitud recibida' }),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Logout - limpia tokens y redirige al login
   */
  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return this.tokenSignal() || localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.userSignal();
  }

  /**
   * Obtiene el ID del contribuyente actual
   */
  getContribuyenteId(): number | null {
    // Prioridad 1: localStorage
    const storedId = localStorage.getItem(this.CONTRIBUYENTE_ID_KEY);
    if (storedId) {
      const id = Number(storedId);
      if (!isNaN(id)) return id;
    }

    // Prioridad 2: usuario actual
    return this.contribuyenteId();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Refresca el usuario desde el servidor
   */
  refreshUser(): Observable<User> {
    const url = `${this.config.getApiUrl('auth')}/CuentaContribuyente/me`;

    return this.http.get<User>(url).pipe(
      tap(user => {
        this.setUser(user);
      }),
      catchError(error => {
        console.error('Error refreshing user:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Maneja el éxito de autenticación
   */
  private handleAuthSuccess(response: AuthResponse): void {
    if (response.token) {
      this.setToken(response.token);
    }

    if (response.user) {
      this.setUser(response.user);
    }

    // Guardar contribuyenteId si está disponible
    const contribId = response.user?.contribuyenteId || response.user?.id;
    if (contribId) {
      localStorage.setItem(this.CONTRIBUYENTE_ID_KEY, contribId.toString());
    }
  }

  /**
   * Maneja errores de autenticación
   */
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error en la autenticación';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || 
                     error.error?.error || 
                     `Error ${error.status}: ${error.statusText}`;
    }

    console.error('[AuthService]', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Guarda el token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  /**
   * Guarda el usuario
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
    this.userSubject.next(user);
  }

  /**
   * Carga el usuario desde localStorage al iniciar
   */
  private loadUserFromStorage(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userJson = localStorage.getItem(this.USER_KEY);

      if (token) {
        this.tokenSignal.set(token);
      }

      if (userJson) {
        const user = JSON.parse(userJson);
        this.userSignal.set(user);
        this.userSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.clearAuthData();
    }
  }

  /**
   * Limpia todos los datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.CONTRIBUYENTE_ID_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.userSubject.next(null);
  }
}
