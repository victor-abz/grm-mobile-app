import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import List from '../components/List';
import SearchBar from '../components/SearchBar';
import { ActivityIndicator } from 'react-native-paper';

function Content({ issues, eadl }) {
  const navigation = useNavigation();
  const [searchPhrase, setSearchPhrase] = useState('');
  const [clicked, setClicked] = useState(false);

  return (
    <View>
      <SearchBar
        searchPhrase={searchPhrase}
        setSearchPhrase={setSearchPhrase}
        clicked={clicked}
        setClicked={setClicked}
      />
      {
        !issues ? (
          <ActivityIndicator size="large" color="#24c38b"/>
        ) : (

          <List
            searchPhrase={searchPhrase}
            data={issues}
            eadl={eadl}
            navigation={navigation}
            setClicked={setClicked}
          />
        )
      }
    </View>
  );
}

export default Content;
