const baseURL = 'http://olegs-macbook-air:5000';

interface AuthPayload {
  Login: string;
  Password: string;
}

function make<R, X>(path: string) {
  return async function (authPayload: R): Promise<X> {
    const response = await fetch(baseURL + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authPayload),
    });
    return (await response.json()) as X;
  };
}

export const apiLogin = make<AuthPayload, { token: string }>('/auth/login');
export const apiRegister = make<AuthPayload, { message: string }>(
  '/auth/register'
);
