import React from "react";
import { ImageBackground, Dimensions, View } from "react-native";
import { Card, Headline } from "react-native-paper";
import RightChevron from '../../../../../assets/right-chevron.svg';
const screenWidth = Dimensions.get("window").width;

function SmallCard({ onCardPress, image, title, icon }) {
  return (
    <Card
      onPress={onCardPress}
      style={{
        width: screenWidth * 0.416,
        height: 156,
        borderRadius: 15,
      }}
    >
      <ImageBackground
        source={image}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 15,
          overflow: "hidden",
          justifyContent: "space-between",
        }}
      >
        <Headline
          style={{
            fontSize: 20,
            fontWeight: "bold",
            fontStyle: "normal",
            textAlign: "left",
            fontFamily: "Poppins_700Bold",
            color: "#ffffff",
            marginLeft: 14,
            marginTop: 14,
          }}
        >
          {title}
        </Headline>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {icon}
          <View style={{ marginRight: 15 }}>
            <RightChevron height={27} width={27} />
          </View>
        </View>
      </ImageBackground>
    </Card>
  );
}

export default SmallCard;
