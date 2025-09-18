import request from "../../../utils/request";
import { BaseRemoteRepository } from "../../shared/BaseRemoteRepository";
import { IssueCategory } from "../../../models/issues/IssueCategory";


class IssueCategoryRemoteRepository extends BaseRemoteRepository<IssueCategory> {
    
    create(item: IssueCategory): Promise<IssueCategory> {
        throw new Error('Method not implemented.');
    }

    delete(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async fetchAll(): Promise<IssueCategory[]> {
        const url = `/issues/issue-categories/`;
        const requestOptions = {
            url,
            method: "GET",
            params: new URLSearchParams({ page: "1", pageSize: "20" }),
        }
        try {
            const response = await request({
                ...requestOptions,
            })

            const jsonData: any = response.data;
            const results: IssueCategory[] = jsonData.results ?? []
            
            return results;
        } catch (error) {
            console.error(error.message);
        }
    }

    fetchById(id: string): Promise<IssueCategory> {
        throw new Error('Method not implemented.');
    }

    update(id: string, item: IssueCategory): Promise<IssueCategory> {
        throw new Error('Method not implemented.');
    }
}

export default IssueCategoryRemoteRepository;
