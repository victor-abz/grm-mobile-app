import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logger } from '../../../../utils/logger';
import BigCard from '../../Dashboard/components/BigCard';

import greenBg from '../../../../../assets/greenBg.png';
import orangeBg from '../../../../../assets/orangeBg.png';
import yellowBg from '../../../../../assets/yellowBg.png';
import purpleBg from '../../../../../assets/purpleBg.png';

const DATA = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    title: 'Budget\nParticipatif',
    background: greenBg,
    navigateTo: 'ParticipatoryBudgetingList',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'GRM',
    background: orangeBg,
    navigateTo: 'GRM',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29d72',
    title: 'Participatif\nsurveillance',
    background: yellowBg,
  },
  {
    id: '58694a0f-3da1-471f-bd96-1454235f9d72',
    title: 'Diagnostics participatifs',
    background: purpleBg,
  },
];

const Content = () => {
  const navigation = useNavigation();

  // Log screen load
  useEffect(() => {
    logger.userAction('screen_load', 'CitizenEngagement', {
      availableOptions: DATA.length,
    });
  }, []);

  const handleCardPress = (item) => {
    logger.userAction('citizen_engagement_option_selected', 'CitizenEngagement', {
      optionId: item.id,
      optionTitle: item.title,
      navigateTo: item.navigateTo || 'WorkInProgress',
    });
    navigation.navigate(item.navigateTo || 'WorkInProgress');
  };

  return (
    <FlatList
      removeClippedSubviews
      data={DATA}
      renderItem={({ item }) => (
        <View style={{ marginVertical: 10 }}>
          <BigCard
            image={item.background}
            onCardPress={() => handleCardPress(item)}
            title={item.title}
            // icon={<TeamWorkIcon />}
          />
        </View>
      )}
    />
  );
};

export default Content;
