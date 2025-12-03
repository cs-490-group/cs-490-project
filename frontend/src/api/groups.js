import api from "./base";

const BASE_URL = '/groups';

class groupAPI {

  createGroup = async (data) => {
    const response = await api.post(`${BASE_URL}/create`, data);
    return response.data || response;
  };

  joinGroup = async (data) => {
    const response = await api.post(`${BASE_URL}/join`, data);
    return response.data || response;
  };

  leaveGroup = async (data) => {
    const response = await api.post(`${BASE_URL}/${data.groupId}/leave`, { 
      groupId: data.groupId,
      uuid: data.uuid 
    });
    return response.data || response;
  };

  getAllUserGroups = async (uuid) => {
    const response = await api.get(`${BASE_URL}/user/${uuid}`);
    return response.data || response;
  };

  getAllGroups = async () => {
    const response = await api.get(`${BASE_URL}`);
    return response.data || response;
  };

  getGroup = async (groupId) => {
    const response = await api.get(`${BASE_URL}/${groupId}`);
    return response.data || response;
  };

  getUserGroup = async (uuid, groupId) => {
    const response = await api.get(`${BASE_URL}/${groupId}/user/${uuid}`);
    return response.data || response;
  };

 
  updateGroupSettings = async (groupId, data) => {
    const response = await api.put(`${BASE_URL}/${groupId}`, data);
    return response.data || response;
  };


  updateUserInGroup = async (uuid, groupId, data) => {
    const response = await api.put(`${BASE_URL}/${groupId}/user/${uuid}`, data);
    return response.data || response;
  };
  

}

export default new groupAPI();
