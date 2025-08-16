// authenticated request.js sample
import axios from "axios";
import { getSessionData } from "../store/ducks/authentication.duck";
import config from "../../config";

const client = axios.create({ baseUrl: config.API_AUTH_BASE_URL });

const request = async ({ ...options }) => {
  const sessionData = await getSessionData();
  const token = sessionData?.token; // Use optional chaining to safely access token

  if (token) {
    client.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    // Handle the case when the token is null or undefined
    console.warn("No token found. Authorization header will not be set.");
    delete client.defaults.headers.common.Authorization; // Remove the header if no token
  }

  const onSuccess = (response) => response;
  const onError = (error) => {
    // You might want to handle specific error cases here
    console.error("Request error:", error);
    return Promise.reject(error); // Reject the promise to handle it in the calling code
  };

  return client(options).then(onSuccess).catch(onError);
};

export default request;
