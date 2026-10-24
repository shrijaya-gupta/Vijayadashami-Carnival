/// <reference types="vite/client" />

declare module 'qrcode' {
  const qrcode: any;
  export default qrcode;
  export function toDataURL(text: string, options?: any): Promise<string>;
}
