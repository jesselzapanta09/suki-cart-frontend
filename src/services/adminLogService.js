import api from "./api";

export function getAdminLogs(params = {}) {
    return api.get("/admin/logs", { params });
}
