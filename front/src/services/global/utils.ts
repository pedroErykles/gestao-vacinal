import api from "../../lib/axios";

const defaultSearchPath = '/busca'

export const similaritySearch = async <T>(termo: string, entity: string): Promise<T> => {
    const res = await api.get<T>(entity + defaultSearchPath, {
        params: {
            termo: termo
        }
    });

    return res.data;
}