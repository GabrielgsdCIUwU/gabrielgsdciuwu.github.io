import axios from 'axios';
import https from 'node:https';

/**
 * @fileoverview Infrastructure client that queries GitHub branches prioritizing develop and handling collaborator/organization repos.
 */
export class GitHubApiClient {
  #client;
  #prioritizedBranches;

  constructor(apiToken, prioritizedBranches = ['develop', 'main', 'master']) {
    this.#prioritizedBranches = prioritizedBranches;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true
    });

    this.#client = axios.create({
      baseURL: 'https://api.github.com',
      httpsAgent,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Gabrielgsd-Portfolio-Sync',
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
      },
      timeout: 15000
    });
  }

  async getLatestCommitInfo(repository) {
    const repositoryMetadata = await this.#fetchRepositoryMetadata(repository);
    if (!repositoryMetadata) {
      return null;
    }

    const branchesToCheck = [...new Set([
      ...this.#prioritizedBranches,
      repositoryMetadata.defaultBranch
    ])];

    for (const branch of branchesToCheck) {
      const branchCommitDate = await this.#fetchBranchCommitDate(repository, branch);
      if (branchCommitDate) {
        return {
          date: branchCommitDate,
          source: branch
        };
      }
    }

    if (repositoryMetadata.pushedAt) {
      return {
        date: repositoryMetadata.pushedAt,
        source: 'repository_push'
      };
    }

    return null;
  }

  async #fetchRepositoryMetadata(repository) {
    try {
      const response = await this.#client.get(`/repos/${repository.owner}/${repository.name}`);
      return {
        defaultBranch: response.data?.default_branch || 'main',
        pushedAt: response.data?.pushed_at ? new Date(response.data.pushed_at) : null
      };
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(`⚠️ [${repository.owner}/${repository.name}] Not accessible. If private, ensure you use a Classic PAT with 'repo' scope.`);
        return null;
      }
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or missing GITHUB_TOKEN in .env');
      }
      if (error.response?.status === 403) {
        throw new Error('API Rate Limit Exceeded or token lacks permission to this repository');
      }
      throw error;
    }
  }

  async #fetchBranchCommitDate(repository, branch) {
    try {
      const response = await this.#client.get(
        `/repos/${repository.owner}/${repository.name}/commits/${branch}`
      );
      const rawDate = response.data?.commit?.committer?.date || response.data?.commit?.author?.date;
      return rawDate ? new Date(rawDate) : null;
    } catch (error) {
      const statusCode = error.response?.status;
      if (statusCode === 404 || statusCode === 422) {
        return null;
      }
      throw error;
    }
  }
}