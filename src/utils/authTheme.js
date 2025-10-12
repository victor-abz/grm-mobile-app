import { colors } from './colors';

// Shared theme configuration for authentication screens
export const authTheme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
  },
};

// Shared text input colors for authentication screens
export const authInputColors = {
  textColor: '#000000', // Black text for user input
  placeholderColor: colors.placeholder, // Gray for placeholder
  iconColor: '#24c38b', // Primary green for icons
};

// Shared button colors for authentication screens
export const authButtonColors = {
  backgroundColor: '#24c38b', // Primary green
  textColor: 'white', // White text
};
