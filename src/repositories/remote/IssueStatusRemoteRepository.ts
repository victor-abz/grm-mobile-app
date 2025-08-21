import request from "../../utils/request";
import { BaseRemoteRepository } from "./BaseRemoteRepository";
import { IssueStatus } from "../../models/issue_status";


class IssueStatusRemoteRepository extends BaseRemoteRepository<IssueStatus> {

    create(item: IssueStatus): Promise<IssueStatus> {
        throw new Error('Method not implemented.');
    }

    delete(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async fetchAll(): Promise<IssueStatus[]> {
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
            const results: IssueStatus[] = jsonData.results

            return results;
        } catch (error) {
            console.error(error.message);
        }
    }

    fetchById(id: string): Promise<IssueStatus> {
        throw new Error('Method not implemented.');
    }

    update(id: string, item: IssueStatus): Promise<IssueStatus> {
        throw new Error('Method not implemented.');
    }
}

export default IssueStatusRemoteRepository;