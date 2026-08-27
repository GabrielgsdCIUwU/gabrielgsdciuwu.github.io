import { CronJob } from 'cron';
import { GitHubApiClient } from '../infrastructure/github/GitHubApiClient.js';
import { ProjectsSynchronizer } from '../application/projects/ProjectsSynchronizer.js';

/**
 * @fileoverview Background cron job scheduled weekly to avoid unnecessary API consumption.
 */
export function initProjectsSyncJob() {
  const token = process.env.GITHUB_TOKEN;
  const client = new GitHubApiClient(token);
  const synchronizer = new ProjectsSynchronizer(client);

  // Executes every Monday at 03:00 AM
  const job = new CronJob('0 3 * * 1', async () => {
    try {
      console.log('Running weekly automated projects synchronization...');
      await synchronizer.synchronize();
      console.log('Weekly projects synchronization finished.');
    } catch (error) {
      console.error('Weekly projects synchronization encountered an error:', error);
    }
  });

  job.start();
  return job;
}