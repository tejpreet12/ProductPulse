import { ms } from "./scaling-units";

export const COMMON_SIZES = {
  micro: ms(0.5),

  xs: ms(2),

  sm: ms(3),

  base: ms(4),

  md: ms(6),

  mlg: ms(7),

  lg: ms(8),

  lxl: ms(9),

  xl: ms(10),

  "2xl": ms(12),

  "3xl": ms(16),

  "4xl": ms(20),

  "5xl": ms(24),

  "6xl": ms(28),

  "7xl": ms(32),

  "8xl": ms(36),

  "9xl": ms(40),

  "10xl": ms(48),

  "11xl": ms(56),

  "12xl": ms(64),

  "13xl": ms(72),

  "14xl": ms(80),

  "15xl": ms(96),
} as const;

export default {
  COMMON_SIZES,
};

