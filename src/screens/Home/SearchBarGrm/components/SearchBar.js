import { Entypo, Feather } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../../utils/colors';

const styles = StyleSheet.create({
  container: {
    margin: 15,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    width: '90%',
    fontFamily: 'Poppins_400Regular',
  },
  searchBar__unclicked: {
    padding: 10,
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#d9dbda',
    borderRadius: 15,
    alignItems: 'center',
  },
  searchBar__clicked: {
    padding: 10,
    flexDirection: 'row',
    width: '80%',
    backgroundColor: '#d9dbda',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginRight: 3,
  },
  input: {
    fontSize: 15,
    marginLeft: 10,
    width: '90%',
    fontFamily: 'Poppins_400Regular',
    paddingLeft: 10,
    paddingRight: 10,
  },
});

const SearchBar = ({ clicked, searchPhrase, setSearchPhrase, setClicked }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={!clicked ? styles.searchBar__unclicked : styles.searchBar__clicked}>
        <Feather name="search" size={20} color={colors.primary} style={{ paddingLeft: 10 }} />
        <TextInput
          style={styles.input}
          placeholder={t('search')}
          placeholderTextColor={colors.placeholder}
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          onFocus={() => {
            setClicked(true);
          }}
        />

        {clicked && (
          <Entypo
            name="cross"
            size={20}
            color={colors.primary}
            style={{ padding: 1, marginEnd: 5 }}
            onPress={() => {
              setSearchPhrase('');
            }}
          />
        )}
      </View>
      {clicked && (
        <View style={{ marginLeft: 3 }}>
          <Button
            color={colors.primary}
            title={t('cancel')}
            onPress={() => {
              Keyboard.dismiss();
              setClicked(false);
            }}
          />
        </View>
      )}
    </View>
  );
};

export default SearchBar;
