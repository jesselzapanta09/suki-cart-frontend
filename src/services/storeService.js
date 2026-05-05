import api from "./api";

export function getPublicStore(id) {
    return api.get(`/stores/${id}`);
}
