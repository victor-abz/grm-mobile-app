import request from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { config } from '../../../../config.dev';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { IssueAttachment } from "../../../models/issues/IssueAttachment";

class IssueAttachmentRemoteRepository extends BaseRemoteRepository<IssueAttachment> {
    private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;
    async create(item: IssueAttachment): Promise<IssueAttachment> {
        const formData = new FormData();
        formData.append('file', item.local_url);
        const body = {
            file: formData,
        };

        const url = `${this.baseUrl}/${item.parent_id}/add-attachment/`;

        const requestOptions = {
            url,
            method: 'POST',
            body: JSON.stringify(body),
        };

        try {
            const response = await request({
                ...requestOptions,
            });

            const jsonData: any = response.data;
            return jsonData.results;
        } catch (error) {
            console.error("Error creating issue attachment at remote", error.message);
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
    ): Promise<IssueAttachment[]> {
        const url = `${this.baseUrl}/${parentId}/attachment/`;
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

    async fetchById(id: string): Promise<IssueAttachment> {
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
            console.error("Error at fetching issues attachament from remote", error.message);
        }
    }

    update(id: string, item: IssueAttachment): Promise<IssueAttachment> {
        throw new Error('Method not implemented.');
    }
}

export default IssueAttachmentRemoteRepository;
