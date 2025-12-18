import api from "./base";


const BASE_URL = "/ai";

class AIApi {

    generateText(data){
        return api.post(`${BASE_URL}/generate`,data);
    }
}


export default new AIApi();