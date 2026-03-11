import { fetchClient } from "@/lib/fetch.client";
import { ClientUser } from "3u-aura-common";

export async function apiUserGetProfile() {
  const response = await fetchClient<ClientUser>(`/api/v1/user/profile`);
  return response;
}
