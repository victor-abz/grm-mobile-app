import { StyleSheet, Text, View, Animated } from 'react-native';
import React from 'react';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';

interface TooltipProps {
  children?: React.ReactNode;
  label?: string;
  visible?: boolean;
}

export default function Tooltip({ children, label, visible = true }: TooltipProps) {
  const [opacity, setOpacity] = React.useState(0);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {children ? (
        children
      ) : (
        <View style={styles.content}>
          <Text style={styles.text}>{label ?? 'Tooltip'}</Text>
          <FontAwesome5
            style={styles.arrow}
            name="caret-right"
            size={24}
            color="rgba(30, 30, 40, 0.95)"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
    width: 250,
    maxWidth: 250,
    flexDirection: 'row',
    justifyContent: 'center',
    right: 60,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 250,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    right: -8,
    top: '50%',
    transform: [{ translateY: -12 }],
  },

  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
    paddingHorizontal: 16,
  },
});
