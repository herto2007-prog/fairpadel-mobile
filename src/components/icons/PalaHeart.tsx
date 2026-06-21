import Svg, { Path, Line, Circle } from 'react-native-svg';
import { colors } from '../../lib/theme';

/**
 * Ícono propio de FairPadel: dos palas formando un corazón.
 * Reacción "Me gusta" del feed. La idea: las dos lomas del corazón son las
 * cabezas de las palas (con sus huequitos) y los dos mangos se cruzan en la punta.
 *
 * - filled=false: contorno (no reaccionado)
 * - filled=true: relleno rojo (ya reaccionaste)
 */
export function PalaHeart({
  size = 22,
  filled = false,
  color = colors.primary,
}: {
  size?: number;
  filled?: boolean;
  color?: string;
}) {
  // Corazón clásico en viewBox 24x24. Las dos lomas = cabezas de pala.
  const heart =
    'M12 20.5 C 6 16.5, 2.5 12.8, 2.5 8.8 C 2.5 5.9, 4.7 4, 7.1 4 C 9 4, 10.7 5.2, 12 7.2 ' +
    'C 13.3 5.2, 15 4, 16.9 4 C 19.3 4, 21.5 5.9, 21.5 8.8 C 21.5 12.8, 18 16.5, 12 20.5 Z';

  const trazo = filled ? 'rgba(255,255,255,0.92)' : color;       // mangos + huecos
  const hueco = filled ? 'rgba(255,255,255,0.92)' : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={heart}
        fill={filled ? color : 'none'}
        stroke={filled ? 'none' : color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Mangos de las dos palas cruzándose hacia la punta del corazón */}
      <Line x1="7.2" y1="8.2" x2="13" y2="16.5" stroke={trazo} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="16.8" y1="8.2" x2="11" y2="16.5" stroke={trazo} strokeWidth={1.4} strokeLinecap="round" />
      {/* Huequitos de las cabezas (se desvanecen en tamaño chico, dan textura de pala) */}
      <Circle cx="6.6" cy="8.4" r="0.7" fill={hueco} />
      <Circle cx="8.4" cy="8.0" r="0.7" fill={hueco} />
      <Circle cx="7.5" cy="9.9" r="0.7" fill={hueco} />
      <Circle cx="15.6" cy="8.4" r="0.7" fill={hueco} />
      <Circle cx="17.4" cy="8.0" r="0.7" fill={hueco} />
      <Circle cx="16.5" cy="9.9" r="0.7" fill={hueco} />
    </Svg>
  );
}
