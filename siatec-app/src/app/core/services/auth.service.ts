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
    return user?.contribuyenteId || null;
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
    const url = `${this.config.getApiUrl('auth')}/login`;

    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Crear nueva cuenta de contribuyente
   */
  createAccount(data: CreateAccountData): Observable<AuthResponse> {
    const url = `${this.config.getApiUrl('auth')}/register`;

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
    const url = `${this.config.getApiUrl('auth')}/me`;

    return this.http.put(url, data).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Solicitud de recuperación de contraseña
   */
  requestPasswordRecovery(payload: PasswordRecoveryRequest): Observable<PasswordRecoveryResponse> {
    const url = `${this.config.getApiUrl('auth')}/forgot-password`;
    const body = {
      email: payload.email
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
   * Obtiene el ID del contribuyente actual (numérico para compatibilidad legacy)
   */
  getContribuyenteId(): number | null {
    // Prioridad 1: usuario actual
    const user = this.userSignal();
    if (user?.contribuyenteId) {
      return user.contribuyenteId;
    }

    // Prioridad 2: localStorage
    const storedId = localStorage.getItem(this.CONTRIBUYENTE_ID_KEY);
    if (storedId) {
      const id = Number(storedId);
      if (!isNaN(id)) return id;
    }

    // Prioridad 3: computed signal
    const contribuyenteId = this.contribuyenteId();
    if (typeof contribuyenteId === 'number') {
      return contribuyenteId;
    }

    return null;
  }

  /**
   * Obtiene el UUID del usuario autenticado actual.
   * Usado para endpoints que requieren el identificador único del usuario.
   */
  getUserId(): string | null {
    const user = this.userSignal();
    return user?.id ? String(user.id) : null;
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
    const url = `${this.config.getApiUrl('auth')}/me`;

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
  private handleAuthSuccess(response: AuthResponse | any): void {
    // Soportar diferentes estructuras de respuesta del backend
    const token = response.token || response.accessToken || response.data?.token;
    // El backend envía el usuario directamente en response.data, NO en response.data.user
    const user = response.data || response.user || response.data?.user;

    console.log('[AuthService] handleAuthSuccess - response:', response);
    console.log('[AuthService] handleAuthSuccess - token:', token);
    console.log('[AuthService] handleAuthSuccess - user:', user);

    if (token) {
      this.setToken(token);
    } else {
      console.warn('[AuthService] No se recibió token en la respuesta');
    }

    if (user) {
      this.setUser(user);

      // Guardar contribuyenteId si está disponible (ya normalizado en camelCase)
      const contribId = user.contribuyenteId;
      if (contribId) {
        localStorage.setItem(this.CONTRIBUYENTE_ID_KEY, contribId.toString());
        console.log('[AuthService] ✅ contribuyenteId guardado:', contribId);
      } else {
        console.warn('[AuthService] ⚠️ No se encontró contribuyenteId en el usuario');
      }
    } else {
      console.warn('[AuthService] No se recibió usuario en la respuesta');
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
    // Normalizar el usuario para incluir propiedades computadas
    const normalizedUser = this.normalizeUser(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    this.userSignal.set(normalizedUser);
    this.userSubject.next(normalizedUser);
  }

  /**
   * Normaliza un objeto User para incluir todas las propiedades computadas
   */
  private normalizeUser(user: User): User {
    const normalized: any = {};

    for (const key in user) {
      const value = (user as any)[key];
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      normalized[camelKey] = value;
    }

    // Propiedades computadas
    const nombres = normalized.nombres || '';
    const primerApellido = normalized.primerApellido || '';
    const segundoApellido = normalized.segundoApellido || '';

    return {
      ...normalized,
      nombre: nombres,
      apellidos: [primerApellido, segundoApellido].filter(Boolean).join(' '),
      nombreCompleto: [nombres, primerApellido, segundoApellido].filter(Boolean).join(' ')
    };
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
        const normalizedUser = this.normalizeUser(user);
        this.userSignal.set(normalizedUser);
        this.userSubject.next(normalizedUser);
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
