import api from "../api/client";

export const tenantService = {
  getMyAccess: async () => {
    const { data } = await api.get("tenants/access");
    return data;
  },
  getInviteCode: async () => {
    const { data } = await api.post("tenants/invite-code");
    return data;
  },
  joinTenant: async (code) => {
    const { data } = await api.post(`tenants/join?code=${code}`);
    return data;
  },
};
