import { apiUserGetProfile } from "@/api/user";
import { useQuery } from "@tanstack/react-query";

// 共享的 queryFn，可以在组件内外使用
export const userProfileQueryFn = () => apiUserGetProfile();

export function useUserProfileQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: userProfileQueryFn,
    enabled,
  });
}
