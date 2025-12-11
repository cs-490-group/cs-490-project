import api from "./base";

const BASE_URL = '/posts';

class postsAPI {
  createPost = async (data) => {
    const response = await api.post(`${BASE_URL}/${data.groupId}/create`, data);
    return response.data || response;
  };

  getGroupPosts = async (groupId) => {
    const response = await api.get(`${BASE_URL}/${groupId}`);
    return response.data || response;
  };

  likePost = async (groupId, postId, uuid) => {
    const response = await api.post(`${BASE_URL}/${groupId}/${postId}/like`, { uuid });
    return response.data || response;
  };

  unlikePost = async (groupId, postId, uuid) => {
    const response = await api.post(`${BASE_URL}/${groupId}/${postId}/unlike`, { uuid });
    return response.data || response;
  };

  addComment = async (groupId, postId, text, uuid,username) => {
    const response = await api.post(`${BASE_URL}/${groupId}/${postId}/comment`, { text, uuid,username });
    return response.data || response;
  };

  deleteComment = async (groupId, postId, commentId, uuid) => {
  const response = await api.delete(`${BASE_URL}/${groupId}/${postId}/comment/${commentId}`, { params: { uuid } });
  return response.data || response;
};


 deletePost = async (groupId, postId, uuid) => {
  const response = await api.delete(`${BASE_URL}/${groupId}/${postId}`, {
    params: { uuid }
  });
  return response.data || response;
};


  updatePost = async (groupId, postId, data) => {
    const response = await api.put(`${BASE_URL}/${groupId}/${postId}`, data);
    return response.data || response;
  };
}

export default new postsAPI();