const { StyleSheet, Dimensions } = require("react-native");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerContainer: {
    elevation: 0,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
    paddingVertical: 12,
    color: '#111827',
    fontSize: Dimensions.get('window').width < 400 ? 18 : 22,
    fontWeight: 'bold',
    paddingHorizontal: 25,
    textTransform: 'uppercase',
  },
});
