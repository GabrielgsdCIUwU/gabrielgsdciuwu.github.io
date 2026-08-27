import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GitHubApiClient } from '../infrastructure/github/GitHubApiClient.js';
import { ProjectsSynchronizer } from '../application/projects/ProjectsSynchronizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function execute() {
  const token = process.env.GITHUB_TOKEN;
  const apiClient = new GitHubApiClient(token);
  const synchronizer = new ProjectsSynchronizer(apiClient);

  console.log('Starting projects catalog synchronization with GitHub...');
  await synchronizer.synchronize();
  console.log('Synchronization completed successfully.');
}

execute().catch(error => {
  console.error('Fatal execution error:', error);
  process.exit(1);
});