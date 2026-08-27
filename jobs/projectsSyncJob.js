import { CronJob } from 'cron';
import { GitHubApiClient } from '../infrastructure/github/GitHubApiClient.js';
import { ProjectsSynchronizer } from '../application/projects/ProjectsSynchronizer.js';

/**
 * @fileoverview Initializes background cron job for scheduled project synchronization.
 */
export function initProjectsSyncJob() {
  const token = process.env.GITHUB_TOKEN;
  const apiClient = new GitHubApiClient(token);
  const synchronizer = new ProjectsSynchronizer(apiClient);

  const job = new CronJob('0 3 * * *', async () => {
    try {
      await synchronizer.synchronize();
    } catch (error) {
      console.error('Projects synchronization cron job encountered an error:', error);
    }
  });

  job.start();
  return job;
}