import config from '../../config';
import request from '../utils/request';

const baseURL = config.API_AUTH_BASE_URL || '';
export { baseURL };

function handleErrors(response)
{
  if (response.non_field_errors) {
    setTimeout(() => alert(response.non_field_errors[0]), 1000);
    throw Error(response.non_field_errors[0]);
  }
  return response;
}

export async function register(data) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify(data),
  };
  const response = await fetch(`${baseURL}/authentication/register/`, requestOptions);
  // eslint-disable-next-line no-return-await
  return await response.json();
}

export async function validateCode(data) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify(data),
  };
  // eslint-disable-next-line no-console
  const fetchResponse = await fetch(`${baseURL}/authentication/facilitator-credentials/update/`, {
    ...requestOptions,
  });
  // eslint-disable-next-line no-return-await
  return await fetchResponse.json();
}

export async function fetchAuthCredentials(data) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    try {
      const response = await fetch(`${baseURL}/authentication/login/`, requestOptions)
      const result = handleErrors(response)      
      return await result.json();
    } catch (error) {
      return { error: 'Failed to fetch authentication credentials' };
    }
}
  
export async function fetchFacilitatorProfile() {
  const url = `/authentication/facilitator-profile/`;
  const requestOptions = {
    url,
    method: 'GET',
  };
  try {
    const response = await request({
      ...requestOptions,
    });
    const jsonData = response.data;
    return jsonData;
  } catch (error) {
    console.error(JSON.stringify(error.message));
    return { error: error } 
  }
}

export async function checkToken()
{
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
  };
  const result = fetch(`${baseURL}/authentication/check-token/`, requestOptions)
    .then((response) => response.json())
    .then(handleErrors)
    .then((a) => a)
    .catch((error) => ({ error }));
  return result;
}

export async function refreshToken()
{
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
  };
  const result = fetch(`${baseURL}/authentication/refresh-token/`, requestOptions)
    .then((response) => response.json())
    .then(handleErrors)
    .then((a) => a)
    .catch((error) => ({ error }));
  return result;
}


export async function logout() {
  // Besides removing session from storage. Implement it, if a logout endpoint is available.
}

