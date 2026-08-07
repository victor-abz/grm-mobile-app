import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { FrappeApp } from 'frappe-js-sdk';
import { FRAPPE_BASE_URL, SECURE_AUTH_STATE_KEY } from '../utils/constants';
import { networkLogger } from '../utils/networkLogger';
import { uploadPendingLogs } from '../utils/logUploader';

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutRef = useRef(null);

  const logout = useCallback(async () => {
    try {
      if (credentials) {
        const frappe = new FrappeApp(FRAPPE_BASE_URL);
        const auth = frappe.auth();
        await auth.loginWithUsernamePassword(credentials);
        await auth.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await SecureStore.deleteItemAsync(SECURE_AUTH_STATE_KEY);
      setIsAuthenticated(false);
      setCredentials(null);
      setUserInfo(null);
      networkLogger.setUser(null);
    }
  }, [credentials]);

  // Update logout ref whenever logout function changes
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const fetchUserInfo = useCallback(async (username, password) => {
    if (!username || !password) {
      console.error('Credentials not found');
      return;
    }

    try {
      const frappe = new FrappeApp(FRAPPE_BASE_URL);
      const auth = frappe.auth();
      console.log({ auth });
      await auth.loginWithUsernamePassword({ username, password });

      const call = frappe.call();
      const userData = await call.get('frappe.auth.get_logged_user');
      setUserInfo(userData);
      // Attribute subsequent network log entries to this user, then flush
      // anything buffered before sign-in now that the session can authorise
      // the upload.
      networkLogger.setUser(userData);
      uploadPendingLogs();
    } catch (error) {
      console.error('Error fetching user info:', error);
      if (error.httpStatus === 403 && logoutRef.current) {
        await logoutRef.current();
      }
    }
  }, []);

  const login = useCallback(
    async (username, password) => {
      try {
        const frappe = new FrappeApp(FRAPPE_BASE_URL);
        const auth = frappe.auth();

        const loginResponse = await auth.loginWithUsernamePassword({ username, password });

        if (loginResponse?.message === 'Logged In') {
          // Store credentials securely
          const authData = {
            username,
            password,
          };

          await SecureStore.setItemAsync(SECURE_AUTH_STATE_KEY, JSON.stringify(authData));
          setCredentials(authData);
          setIsAuthenticated(true);
          await fetchUserInfo(username, password);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    [fetchUserInfo]
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const storedAuth = await SecureStore.getItemAsync(SECURE_AUTH_STATE_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.username && authData.password) {
            setCredentials(authData);
            setIsAuthenticated(true);
            await fetchUserInfo(authData.username, authData.password);
          } else {
            // If credentials are invalid, clear them
            await SecureStore.deleteItemAsync(SECURE_AUTH_STATE_KEY);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an error reading the credentials, clear them
        await SecureStore.deleteItemAsync(SECURE_AUTH_STATE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [fetchUserInfo]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      credentials,
      userInfo,
      isLoading,
      login,
      logout,
      fetchUserInfo,
    }),
    [isAuthenticated, credentials, userInfo, isLoading, login, logout, fetchUserInfo]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
