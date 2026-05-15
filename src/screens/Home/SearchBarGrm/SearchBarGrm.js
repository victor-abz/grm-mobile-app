import React from 'react';
import { SafeAreaView } from 'react-native';
import Content from './containers';
import { styles } from './SearchBarGrm.style';

function SearchBarGrm() {
  return (
    <SafeAreaView style={styles.container}>
        <Content />
    </SafeAreaView>
  );
}

export default SearchBarGrm;
