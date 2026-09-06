/**
 * Certificate Strategy Interface (Strategy Pattern)
 * Defines the contract for certificate generation strategies.
 * Current: JSON/metadata certificate
 * Future: PDF certificate, Digital Badge (OpenBadges)
 */
export interface ICertificateStrategy {
  generate(data: {
    userId: string;
    courseId: string;
    userName: string;
    courseTitle: string;
    completedAt: Date;
  }): Promise<{ certificateUrl?: string; payload: Record<string, unknown> }>;
}
