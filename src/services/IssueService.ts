
import { Issue } from '../models/Issue';
import { IssueLocalRepository } from '../repositories/local/IssueLocalRepository';
import { IssueRemoteRepository } from '../repositories/remote/IssueRemoteRepository';
import { BaseService } from "./shared/BaseService";

export class IssueService extends BaseService<Issue> {
  constructor() {
    super(new IssueLocalRepository(), new IssueRemoteRepository());
  }
}
