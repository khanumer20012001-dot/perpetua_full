import { EventEmitter } from 'events';

type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * Typed in-process event bus (Observer / Pub-Sub pattern).
 * Used for domain events like CourseCompletedEvent → CertificateIssuedListener.
 */
class EventBus {
  private emitter = new EventEmitter();

  emit<T>(event: string, payload: T): void {
    this.emitter.emit(event, payload);
  }

  on<T>(event: string, handler: EventHandler<T>): void {
    this.emitter.on(event, handler as (...args: any[]) => void);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.emitter.off(event, handler as (...args: any[]) => void);
  }
}

export const eventBus = new EventBus();

// ─── Domain Event Names ─────────────────────────────────────────────────────
export const DomainEvents = {
  COURSE_COMPLETED: 'CourseCompletedEvent',
  OTP_REQUESTED: 'OtpRequestedEvent',
  CERTIFICATE_ISSUED: 'CertificateIssuedEvent',
} as const;

// ─── Event Payload Types ─────────────────────────────────────────────────────
export interface CourseCompletedPayload {
  userId: string;
  courseId: string;
  enrollmentId: string;
}

export interface OtpRequestedPayload {
  email: string;
  code: string;
}

export interface CertificateIssuedPayload {
  userId: string;
  courseId: string;
  certificateId: string;
}
