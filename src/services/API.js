// const baseURL = 'http://10.0.2.2:8000';
const baseURL = 'https://mgp.coso.gouv.bj';
export { baseURL };
function handleErrors(response) {
  if (response.non_field_errors) {
    setTimeout(() => alert(response.non_field_errors[0]), 1000);
    throw Error(response.non_field_errors[0]);
  }
  return response;
}

class API {
  async signUp(data) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    const result = fetch(`${baseURL}/authentication/register/`, requestOptions)
      .then((response) => response.json())
      .then(handleErrors)
      .then((response) => response)
      .catch((error) => ({ error }));
    return result;
  }

  async login(data) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    const result = fetch(`${baseURL}/authentication/obtain-auth-credentials/`, requestOptions)
      .then((response) => response.json())
      .then(handleErrors)
      .then((a) => a)
      .catch((error) => ({ error }));
    console.log ("api_login-funct_result : ", result)
    console.log("baseURL : " + baseURL + "/authentication/obtain-auth-credentials/")
    return result;
  }
}
export default API;
