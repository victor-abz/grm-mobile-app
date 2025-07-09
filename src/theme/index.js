import { MD3LightTheme } from 'react-native-paper';
import { colors } from '../utils/colors';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.white,
    background: colors.white,
    error: colors.error,
    onSurface: '#373737',
    onBackground: '#373737',
    outline: colors.lightgray,
    disabled: colors.disabled,
    // Custom colors from the app
    primaryContainer: colors.primary,
    secondaryContainer: colors.secondary,
    // Proper placeholder colors for better visibility
    placeholder: colors.placeholder,
    onSurfaceVariant: colors.placeholder, // Used by Paper TextInput for placeholders
  },
  roundness: 12,
};

export default paperTheme;
