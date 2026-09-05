declare module 'otp-generator' {
  export function generate(
    length?: number,
    options?: {
      digits?: boolean;
      lowerCaseAlphabets?: boolean;
      upperCaseAlphabets?: boolean;
      specialChars?: boolean;
    }
  ): string;
}
