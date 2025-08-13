// authenticated request.js sample - maybe besides /login if we want a token in requests
import axios from "axios";
import { getSessionData } from "../store/ducks/authentication.duck";
import config from "../../config";

const client = axios.create({ baseUrl: config.API_AUTH_BASE_URL });

const request = async ({ ...options }) => {
  const token = await getSessionData().token;
  client.defaults.headers.common.Authorization = `Token ${token}`;

  const onSuccess = (response) => response;
  const onError = (error) => {
    return error;
  };

  return client(options).then(onSuccess).catch(onError);
};

export default request;