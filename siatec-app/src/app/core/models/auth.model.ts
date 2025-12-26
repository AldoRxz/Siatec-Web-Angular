/**
 * Modelo de usuario autenticado en SIATEC
 */
export interface User {
  id: number | string;
  email: string;
  contribuyenteId?: number;
  idContribuyente?: number;
  nombre?: string;
  apellidos?: string;
  nombreCompleto?: string;
  fullName?: string;
  rfc?: string;
  tipo?: 'fisica' | 'moral';
  identityInfo?: {
    id: number | string;
    email: string;
    [key: string]: any;
  };
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
  token: string;
  user?: User;
  expiresIn?: number;
  refreshToken?: string;
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
