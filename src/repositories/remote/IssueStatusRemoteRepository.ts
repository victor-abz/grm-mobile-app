import request from "../../utils/request";
import { BaseRemoteRepository } from "./BaseRemoteRepository";

export type IssueStatusModel = {
    id: number,
    name: string,
    final_status: boolean,
    initial_status: boolean,
    rejected_status: boolean,
    open_status: boolean,
}

class IssueStatusRemoteRepository extends BaseRemoteRepository<IssueStatusModel> {
  
    create(item: IssueStatusModel): Promise<IssueStatusModel> {
        throw new Error('Method not implemented.');
    }
    
    delete(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    
    async fetchAll(): Promise<IssueStatusModel[]> {
        const url = `/issues/issue-statuses/`;
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
            const results: IssueStatusModel[] = jsonData.results
            
            return results;
        } catch (error) {
            console.error(error.message);
        }
    }

    fetchById(id: string): Promise<IssueStatusModel> {
        throw new Error('Method not implemented.');
    }

    update(id: string, item: IssueStatusModel): Promise<IssueStatusModel> {
        throw new Error('Method not implemented.');
    }
}

export default IssueStatusRemoteRepository;




