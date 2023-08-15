import { colors } from '../../../../../utils/colors';
const { StyleSheet } = require("react-native");

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 80,
    flex: 1,
    width: "100%",
  },
  itemContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  titleText: {
    textTransform: 'uppercase',
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: colors.secondary,
  },
});
