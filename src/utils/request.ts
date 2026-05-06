import axios from "axios";
import config from "../../config";
import { appVersion } from "./appVersion";

export const client = axios.create({ baseURL: config.API_AUTH_BASE_URL });

const request = ({ ...options }) => {
  client.defaults.headers.common["App-Version"] = appVersion;
  const onSuccess = (response) => response;
  const onError = (error) => {

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.log(error.response.data);
      // console.log(error.response.status);
      // console.log(error.response.headers);
      return Promise.reject({message: `${error.status ?? ''} http client response error: ${error.response.status}`});
      // Reject the promise to handle it in the calling code
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log('The request was made but no response was received - Error: ', error.request);
      return Promise.reject({ message: JSON.stringify(error.request) });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
      return Promise.reject({ message: error.message });
    }
  };
  return client(options).then(onSuccess).catch(onError);
};



export default request;