import { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../lib/theme';

/**
 * Placeholder "que late" para estados de carga (más prolijo que un spinner pelado).
 */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const op = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);

  return (
    <Animated.View
      style={[{ backgroundColor: colors.dark100, borderRadius: 8, opacity: op }, style]}
    />
  );
}
