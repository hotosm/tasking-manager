import { API_URL } from '../config';

export async function postNewUser(user: unknown) {
  return await fetch(`${API_URL}users/actions/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  }).then((res) => {
    return res.json();
  });
}
