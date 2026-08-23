import request, { client } from '../../../utils/request';
import { BaseRemoteRepository } from '../../shared/BaseRemoteRepository';
import { config } from '../../../../config.dev';
import { SortOrder } from '@nozbe/watermelondb/QueryDescription';
import { IssueAttachment } from '../../../models/issues/IssueAttachment';

class IssueAttachmentRemoteRepository extends BaseRemoteRepository<IssueAttachment> {
  private baseUrl = `${config.API_AUTH_BASE_URL}/issues`;

  async fetchById(id: string): Promise<IssueAttachment> {
    throw new Error('Method not implemented.');
  }

  async create(item: IssueAttachment): Promise<IssueAttachment> {
    const formData = new FormData();

    const url = `${this.baseUrl}/${item.parent_id}/add-attachment`;

    formData.append('file', {
      uri: item.local_url,
      type: item.is_audio ? 'audio/mpeg' : 'image/png',
      name: item.name,
    });

    const requestOptions = {
      url,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'content-type': 'multipart/form-data',
      },
      data: formData,
    };

    try {
      const response = await request({
        ...requestOptions,
      });
      const jsonData: any = response.data;
      return jsonData;
    } catch (error) {
      console.error('Error creating issue attachment at remote', error.message);
    }
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async fetchAll(
    endpointType: string | null,
    sortBy: string | null,
    sortOrder: SortOrder | null,
    page: number | null,
    limit: number | null,
    allPages: boolean | null,
    createdAt: EpochTimeStamp | null,
    updatedAt: EpochTimeStamp | null,
    deletedAt: EpochTimeStamp | null,
    parentId: string | null
  ): Promise<IssueAttachment[]> {
    const params: Record<string, string> = {};

    if (endpointType) params.endpoint_type = endpointType;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = String(sortOrder);
    
    if (createdAt) params.created_at = new Date(createdAt).toISOString();
    if (updatedAt) params.updated_at = new Date(updatedAt).toISOString();
    if (deletedAt) params.deleted_at = new Date(deletedAt).toISOString();
    
    params.page = String(page ?? 1);
    params.pageSize = String(limit ?? 20);
    
    const _url = `/issues/${parentId}/attachments/`;
    
    let requestOptions = {
      url: _url,
      method: 'GET',
      params: new URLSearchParams(params),
    };

    try {
      let attachmentsList: IssueAttachment[] = [];
      let lastPage = false;
      let url = `/issues/${parentId}/attachments/`;
      if (allPages) {
        while (!lastPage) {
          requestOptions = {
            ...requestOptions,
            url,
            // Keep initial query params for the first request. For subsequent requests,
            // the server-provided `next` URL already includes the querystring.
            params: url.includes('?') ? undefined : requestOptions.params,
          };

          const response = await request({
            ...requestOptions,
          });

          if (
            response &&
            response.data &&
            response.data.results &&
            Array.isArray(response.data.results)
          ) {
            attachmentsList = attachmentsList.concat(response.data.results);
            if (!response.data.next) {
              lastPage = true;
            } else {
              
              url = response.data.next.substring(response.data.next.indexOf('/issues'));
            }
          } else {
            lastPage = true;
          }
        }

        const results: IssueAttachment[] = attachmentsList ?? [];
        return results;
      }
      
      const response = await request({
        ...requestOptions,
      });

      const jsonData: any = response.data;
      return jsonData.results;
    } catch (error) {
      console.error('Error at fetching issues attachment from remote');
    }
  }

  update(id: string, item: IssueAttachment): Promise<IssueAttachment> {
    console.log('[Issue Attachment Update] - Method not implemented.');
    return;
  }
}

export default IssueAttachmentRemoteRepository;
