import React, { useContext, createContext, useState, useEffect, useMemo } from 'react';
import { FrappeApp } from 'frappe-js-sdk';
import { AuthContext } from './AuthProvider';
import { FRAPPE_BASE_URL } from '../utils/constants';
import { logger } from '../utils/logger';

const FrappeContext = createContext();

const FrappeProvider = ({ children }) => {
  const { accessToken } = useContext(AuthContext);
  const [db, setDb] = useState(null);
  const [call, setCall] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      logger.debug('FrappeProvider: No access token available');
      return;
    }

    try {
      logger.info('FrappeProvider: Initializing Frappe connection', {
        baseUrl: FRAPPE_BASE_URL,
        hasToken: !!accessToken,
      });

      const frappe = new FrappeApp(FRAPPE_BASE_URL, {
        useToken: true,
        type: 'Bearer',
        token: () => accessToken,
      });

      setDb(frappe.db());
      setCall(frappe.call());
      setAuth(frappe.auth());

      logger.info('FrappeProvider: Frappe connection initialized successfully');
    } catch (error) {
      logger.error('FrappeProvider: Failed to initialize Frappe connection', error, {
        baseUrl: FRAPPE_BASE_URL,
      });
    }
  }, [accessToken]);

  const contextValue = useMemo(
    () => ({
      db,
      auth,
      call,
    }),
    [db, auth, call]
  );

  return <FrappeContext.Provider value={contextValue}>{children}</FrappeContext.Provider>;
};

export const useFrappe = () => {
  const frappe = useContext(FrappeContext);
  return frappe;
};

export { FrappeContext, FrappeProvider };
