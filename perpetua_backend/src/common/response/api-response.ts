export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(data: T, message?: string): IApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(error: string, message?: string): IApiResponse<null> {
    return {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
