import React from "react";
import { ImageBackground, Dimensions, View, Text } from "react-native";
import { Card, Headline } from "react-native-paper";
const screenWidth = Dimensions.get("window").width;

function SmallCard({ onCardPress, image, title, count }) {
  return (
    <Card
      onPress={onCardPress}
      style={{
        width: screenWidth * 0.298,
        height: 120,
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
            fontSize: 14,
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
          <Text style={{
            fontSize: 30,
            color: '#ffffff',
            fontWeight: 'bold',
            padding: 10
          }}>
            {count}
          </Text>
        </View>
      </ImageBackground>
    </Card>
  );
}

export default SmallCard;
