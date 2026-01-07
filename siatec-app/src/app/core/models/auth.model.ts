/**
 * Modelo de usuario autenticado en SIATEC
 * Propiedades en camelCase (convención TypeScript)
 */
export interface User {
  id?: string;
  email?: string;
  userName?: string;
  nombres?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  roles?: string[];
  contribuyenteId?: number;
  
  // Propiedades computadas
  nombre?: string;
  apellidos?: string;
  nombreCompleto?: string;
}

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del servidor de autenticación
 */
export interface AuthResponse {
  token?: string;
  accessToken?: string;
  user?: User;
  data?: any;
  expiresIn?: number;
  refreshToken?: string;
  success?: boolean;
  message?: string;
}

/**
 * Datos para crear cuenta de contribuyente
 */
export interface CreateAccountData {
  email: string;
  password: string;
  confirmPassword?: string;
  nombre?: string;
  apellidos?: string;
  tipo?: 'fisica' | 'moral';
  [key: string]: any;
}

/**
 * Datos para actualizar cuenta de contribuyente
 */
export interface UpdateAccountData {
  id?: number;
  userName: string;
  email: string;
  nombres: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  oldPassword?: string;
  newPassword?: string;
}

/**
 * Solicitud de recuperación de contraseña
 */
export interface PasswordRecoveryRequest {
  email: string;
  identifier?: string;
  contactPreference?: 'email' | 'sms';
}

export interface PasswordRecoveryResponse {
  message?: string;
  ticketId?: string;
}
