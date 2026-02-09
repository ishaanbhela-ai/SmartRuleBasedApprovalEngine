import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const systemHealthService = {
    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await axios.get(`${API_URL}/up`);
            return response.status === 200;
        } catch (error) {
            console.error("Health check failed", error);
            return false;
        }
    }
};
