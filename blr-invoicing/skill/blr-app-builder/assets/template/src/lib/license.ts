export interface LicenseStatus {
  valid: boolean; message: string; plan: string; edition: string; customer: string; license_id: string; domain: string;
  activated: number; expires: number; days_left: number | null; dev?: boolean;
}
export const licenseApi = () => (typeof window !== "undefined" ? window.baderLicense : undefined);
