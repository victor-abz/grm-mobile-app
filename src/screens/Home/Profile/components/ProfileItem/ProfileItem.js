import React from "react";
import { View } from "react-native";
import { Divider, Text } from "react-native-paper";
import { styles } from "./ProfileItem.style";

const ProfileItem = ({ title, description, pressHandler }) => {
  return (
    <>
      <View style={styles.container}>
          <View style={styles.itemContainer}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
      </View>
      <Divider style={{ marginHorizontal: "5%" }} />
    </>
  );
};

export default ProfileItem;
