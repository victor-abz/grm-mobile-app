export const colors = {
  primary: '#24c38b',
  disabled: '#eeeeee',
  inProgress: '#f5ba74',
  lightgray: '#dedede',
  error: '#ef6a78',
  secondary: '#707070',
  white: '#ffffff',
  // Add placeholder colors for better visibility
  placeholder: '#b0b0b0', // Darker gray for placeholders
  placeholderLight: '#c8c8c8', // Alternative lighter placeholder
};

// Helper function to create consistent input themes
export const createInputTheme = () => ({
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: colors.placeholder,
    text: '#707070',
  },
});
