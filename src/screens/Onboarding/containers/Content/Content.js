import React, { useState } from "react";
import { View } from "react-native";
import { styles } from "./Content.style";
import { Button, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import ThinkingSVG from "../../../../../assets/think.svg";
import { i18n } from "../../../../translations/i18n";

const Content = () => {
  // const { colors } = useTheme();
  const [step, setStep] = useState(2);
  const customStyles = styles();
  const navigation = useNavigation();

  return (
    <View style={customStyles.content}>
      {/*<MapBg*/}
      {/*  width={320}*/}
      {/*  style={{*/}
      {/*    position: "absolute",*/}
      {/*    top: -10,*/}
      {/*    left: 20,*/}
      {/*    bottom: 0,*/}
      {/*  }}*/}
      {/*/>*/}

      <View>
        {/*<EADLLogo height={90} width={180} style={{ marginTop: 100 }} />*/}
      </View>
      {/*</ImageBackground>*/}
      <View>
        <ThinkingSVG />
      </View>
      {/*<Title style={customStyles.upperTitle}>Welcome to EADL</Title>*/}
      <View>
        <Title style={customStyles.title}>{i18n.t('used_app_before')}</Title>
      </View>

      <View style={customStyles.buttonsView}>
        <Button
          style={[customStyles.button, { backgroundColor: "#24c38b" }]}
          mode="contained"
          onPress={() => {
            navigation.navigate("AuthStack", { screen: "Login" });
          }}
        >
          {i18n.t('yes')}
        </Button>
        <Button
          style={customStyles.button}
          color={"white"}
          mode="contained"
          onPress={() => {
            navigation.navigate("AuthStack", { screen: "SignUp" });
          }}
        >
          {i18n.t('no')}
        </Button>
      </View>
    </View>
  );
};

export default Content;
