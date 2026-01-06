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
    if (user) {
      const id = user.contribuyenteId ?? user.idContribuyente;
      if (typeof id === 'number') {
        return id;
      }
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
    if (!user) return null;

    // El id puede ser string (UUID) o number
    const id = user.identityInfo?.id ?? user.id;
    return id ? String(id) : null;
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
    } else {
      console.warn('[AuthService] No se recibió usuario en la respuesta');
    }

    // Guardar contribuyenteId si está disponible
    let contribId = null;
    
    // Intentar obtenerlo del usuario primero (más directo)
    contribId = user?.contribuyenteId || user?.idContribuyente;
    
    // Si no está en el usuario, intentar del token JWT
    if (!contribId && token) {
      try {
        const payload = this.parseJwt(token);
        // El sub claim contiene el contribuyenteId como GUID
        // Pero necesitamos buscar si hay un claim específico de contribuyente
        contribId = payload.contribuyente_id || payload.contribuyenteId;
        console.log('[AuthService] JWT payload:', payload);
      } catch (error) {
        console.warn('[AuthService] No se pudo decodificar el token JWT', error);
      }
    }
    
    if (contribId) {
      localStorage.setItem(this.CONTRIBUYENTE_ID_KEY, contribId.toString());
      console.log('[AuthService] contribuyenteId guardado:', contribId);
    } else {
      console.warn('[AuthService] No se pudo obtener el contribuyenteId del login');
    }
  }

  /**
   * Obtiene el contribuyenteId desde el backend usando el RFC del usuario
   */
  private fetchContribuyenteIdFromBackend(): void {
    const user = this.getCurrentUser();
    const rfc = user?.rfc;
    
    if (!rfc) {
      console.warn('[AuthService] No hay RFC disponible para obtener el contribuyenteId');
      return;
    }

    // Buscar el contribuyente por RFC
    this.http.get(`${this.config.getApiUrl('contribuyentes')}/internal/contribuyentes/rfc/${rfc}`)
      .subscribe({
        next: (contribuyente: any) => {
          if (contribuyente?.id) {
            localStorage.setItem(this.CONTRIBUYENTE_ID_KEY, contribuyente.id.toString());
            console.log('[AuthService] contribuyenteId obtenido del backend:', contribuyente.id);
          }
        },
        error: (error) => {
          console.error('[AuthService] Error al obtener contribuyenteId del backend:', error);
        }
      });
  }

  /**
   * Decodifica un token JWT sin validar la firma
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[AuthService] Error al parsear JWT:', error);
      return null;
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
