import { Dimensions } from 'react-native';

const { width  } = Dimensions.get("screen");

export default {
  containerView: {
    flex: 1,

    backgroundColor: "white",
  },
  loginScreenContainer: {
    flex: 1,
    justifyContent: "space-around",
  },
  logoText: {
    fontSize: 40,
    fontWeight: "800",
    marginTop: 130,
    marginBottom: 30,
    textAlign: "center",
  },
  loginFormView: {
    flex: 1,
  },
  errorText: {
    color: "red",
    paddingLeft: 15,
    marginBottom: 10,
  },
  loginFormTextInput: {
    borderRadius: 20,
    backgroundColor: "white",
    fontSize: 14,
    color: "#707070",
  },
  loginButton: {
    alignSelf: "center",
    width: width - 60,
    height: 47,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    backgroundColor: "#dedede",
  },
  textHint: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    textAlign: "left",
    color: "#24c38b",
  },
  hintContainer: {
    alignItems: "center",
  },
  formContainer: {
    // alignItems: 'center',
  },
  fbLoginButton: {
    height: 45,
    marginTop: 10,
    backgroundColor: "transparent",
  },
};
