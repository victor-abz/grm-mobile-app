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
    letterSpacing: 0.2,
    paddingVertical: 12,
    fontSize: Dimensions.get('window').width < 400 ? 18 : 22,
    fontWeight: '500',
    color: 'rgb(28,28,30,.99)',
    paddingHorizontal: 25,
  },
});
