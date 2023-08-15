const { StyleSheet } = require("react-native");
import { colors } from '../../../../utils/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 20,
  },
  item: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 5,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  containerA: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 20
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 20,
    borderRadius: 15,
  },
  listHeader: {
    color: '#999999',
    fontSize: 13,
    fontWeight: 'bold',
    padding: 15,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightgray
  }
  // listContent: { paddingTop: 20 },
});

export default styles;