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
    const url = `${this.baseUrl}/${parentId}/attachments/`;
    const requestOptions = {
      url,
      method: 'GET',
      params: new URLSearchParams({ page: '1', pageSize: '20' }),
    };
    try {
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
