import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { IssueComment } from '../../../models/issues/IssueComment';
import { config } from '../../../../config.dev';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';

class IssueCommentRemoteRepository extends BaseRemoteRepository<IssueComment> {
    private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;
    async create(item: IssueComment): Promise<IssueComment> {
        const body = {
            comment: item.comment,
        };

        const url = `${this.baseUrl}/${item.parent_id}/add-comment/`;

        const requestOptions = {
            url,
            method: 'POST',
            params: new URLSearchParams({ page: '1', pageSize: '20' }),
            body: JSON.stringify(body),
        };

        try {
            const response = await request({
                ...requestOptions,
            });

            const jsonData: any = response.data;
            return jsonData.results;
        } catch (error) {
            console.error("Error creating issue comment at remote", error.message);
        }
    }

    delete(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async fetchAll(
        sortBy: string | null,
        sortOrder: SortOrder | null,
        limit: number | null,
        createdAt: string | null,
        updatedAt: string | null,
        deletedAt: string | null,
        parentId: string | null,
    ): Promise<IssueComment[]> {
        const url = `${this.baseUrl}/${parentId}/comments/`;
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
            return jsonData.results;
        } catch (error) {
            console.error(error.message);
        }
    }

    async fetchById(id: string): Promise<IssueComment> {
        const url = `${this.baseUrl}/${id}`;
        const requestOptions = {
            url,
            method: 'GET',
        };
        try {
            const response = await request({
                ...requestOptions,
            });

            const jsonData: any = response.data;
            return jsonData.results;
        } catch (error) {
            console.error("Error at fetching issues comment from remote", error.message);
        }
    }

    update(id: string, item: IssueComment): Promise<IssueComment> {
        throw new Error('Method not implemented.');
    }
}

export default IssueCommentRemoteRepository;
