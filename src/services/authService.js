import config from "../../config";

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
    const response = fetch(`${baseURL}/authentication/register/`, requestOptions)
    const result = handleErrors(response)      
    return await result.json();
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
  // Besides removing session from storage. Implement if a logout endpoint is available.
}

