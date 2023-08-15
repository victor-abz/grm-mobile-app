import { StyleSheet } from "react-native";
import {colors} from "../../../../utils/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  commentCard: {
    marginVertical: 5,
    marginHorizontal: 10
  },
  title: {
    fontFamily: "Poppins_700Bold",
    marginVertical: 5,
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#707070",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightgray,
  },
  greenCircle: {
    backgroundColor: colors.primary,
    height: 10,
    width: 10,
    borderRadius: 10,
    marginRight: 10
  },
  subtitle: {
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  stepText: {
    marginVertical: 5,
    fontSize: 29,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#24c38b",
  },
  stepDescription: {
    fontFamily: "Poppins_700Bold",
    marginVertical: 5,
    fontSize: 17,
    fontWeight: "bold",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  stepNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 14,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  radioLabel: {
    fontFamily: "Poppins_400Regular",
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
    fontSize: 13,
  },
  dateLabel: {
    fontSize: 11,
    color: "#707070",
    textAlign: "right"
  },
  grmInput: {
    height: 40,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },

  // dropdown
  dropdownWrapper: {
    marginHorizontal: 50,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  dropdownLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  dropdownContainer: {
    borderColor: "#dedede",
    elevation: 3,
  },
  dropdownStyle: {
    borderColor: "#dedede",
    elevation: 3,
  },
});
