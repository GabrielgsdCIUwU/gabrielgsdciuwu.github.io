import axios from 'axios';

/**
 * @fileoverview HTTP infrastructure client for the GitHub REST API.
 */
export class GitHubApiClient {
  #client;
  #monitoredBranches;

  constructor(apiToken, monitoredBranches = ['main', 'develop']) {
    this.#monitoredBranches = monitoredBranches;
    this.#client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
      },
      timeout: 10000
    });
  }

  async getLatestCommitDate(repository) {
    const branchResults = await Promise.allSettled(
      this.#monitoredBranches.map(branch => this.#fetchBranchCommitDate(repository, branch))
    );

    const validDates = branchResults
      .filter(result => result.status === 'fulfilled' && result.value instanceof Date)
      .map(result => result.value.getTime());

    if (validDates.length > 0) {
      return new Date(Math.max(...validDates));
    }

    return this.#fetchRepositoryLastPushDate(repository);
  }

  async #fetchBranchCommitDate(repository, branch) {
    try {
      const response = await this.#client.get(
        `/repos/${repository.owner}/${repository.name}/commits/${branch}`
      );
      const rawDate = response.data?.commit?.committer?.date || response.data?.commit?.author?.date;
      return rawDate ? new Date(rawDate) : null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async #fetchRepositoryLastPushDate(repository) {
    try {
      const response = await this.#client.get(`/repos/${repository.owner}/${repository.name}`);
      const rawDate = response.data?.pushed_at || response.data?.updated_at;
      return rawDate ? new Date(rawDate) : null;
    } catch {
      return null;
    }
  }
}