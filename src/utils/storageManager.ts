import { enablePromise } from 'react-native-sqlite-storage';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from '../migrations/appSchema';
import migrations from '../migrations/migrations';
import { IssueStatusLocalModel } from "../models/issues/IssueStatus";
import { IssueLocalModel } from "../models/issues/Issue";
import { IssueTypeLocalModel } from "../models/issues/IssueType";
import { IssueSubTypeLocalModel } from '../models/issues/IssueSubType';
import { IssueCategoryLocalModel } from "../models/issues/IssueCategory";
import { IssueComponentLocalModel } from '../models/issues/IssueComponent';
import { IssueAgeGroupLocalModel } from '../models/issues/IssueAgeGroup';
import { IssueSubComponentLocalModel } from '../models/issues/IssueSubComponent';
import { AdministrativeRegionLocalModel } from '../models/issues/AdministrativeRegions';
import { IssueCommentLocalModel } from "../models/issues/IssueComment";
import { IssueAttachmentLocalModel } from "../models/issues/IssueAttachment";
import { IssueCitizenGroupLocalModel } from '../models/issues/IssueCitizenGroup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@nozbe/watermelondb';

const DB_NAME = 'grm-db';
enablePromise(true);

class DatabaseService {
  database: Database | null = null; // 💡 Store the database instance here

  async initDB() {
    try {
      
      const adapter = new SQLiteAdapter({
        schema,
        migrations,
        dbName: DB_NAME,
        onSetUpError: (error) => {
          // Database failed to load -- offer the user to reload the app or log out
          console.log('Watermelon Adapter set up Failed', error);
        },
      });
  
      this.database = new Database({
        adapter,
        modelClasses: [
          AdministrativeRegionLocalModel,
          IssueStatusLocalModel,
          IssueLocalModel,
          IssueTypeLocalModel,
          IssueSubTypeLocalModel,
          IssueCategoryLocalModel,
          IssueComponentLocalModel,
          IssueAgeGroupLocalModel,
          IssueSubComponentLocalModel,
          IssueCommentLocalModel,
          IssueAttachmentLocalModel,
          IssueCitizenGroupLocalModel,
        ],
      });
    } catch (error) {
      console.error(error);
      
    }
  }
}

export const databaseServiceInstance = new DatabaseService();

export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    // saving error
  }
};

export const storeEncryptedData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await SecureStore.setItemAsync(key, jsonValue);
  } catch (e) {
    // saving error
  }
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};

export const getEncryptedData = async (key) => {
  try {
    const jsonValue = await SecureStore.getItemAsync(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};

export const removeValue = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    // remove error
  }
};

export const removeEncryptedValue = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    // remove error
  }
};
