import type { AxiosRequestConfig } from "axios";

export const getPiAuthConfig = (): AxiosRequestConfig | undefined => {
  const accessToken = sessionStorage.getItem("pi_access_token");

  if (!accessToken) {
    return undefined;
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};
