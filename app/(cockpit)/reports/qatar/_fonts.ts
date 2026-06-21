import { Lora, Inter } from 'next/font/google';

// Premium memo typography, scoped to the /reports/qatar route via CSS variables.
export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--qr-serif',
});

export const interMemo = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--qr-sans',
});
