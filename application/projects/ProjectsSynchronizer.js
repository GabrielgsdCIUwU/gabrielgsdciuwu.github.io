import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitHubRepository } from '../../domain/github/GitHubRepository.js';
import { ProjectStatusEvaluator } from '../../domain/projects/ProjectStatusEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @fileoverview Application service coordinating the synchronization between GitHub repositories and localized datasets.
 */
export class ProjectsSynchronizer {
  #gitHubApiClient;
  #evaluator;
  #supportedLocales;

  constructor(gitHubApiClient, evaluator = new ProjectStatusEvaluator(), supportedLocales = ['es', 'en']) {
    this.#gitHubApiClient = gitHubApiClient;
    this.#evaluator = evaluator;
    this.#supportedLocales = supportedLocales;
  }

  async synchronize() {
    const localizedFiles = await this.#loadLocalizedDatasets();
    const primaryProjectsList = localizedFiles[0].content.projectsPage.projects;

    for (let projectIndex = 0; projectIndex < primaryProjectsList.length; projectIndex++) {
      const currentProject = primaryProjectsList[projectIndex];
      const repository = GitHubRepository.fromUrl(currentProject.link);

      if (!repository) {
        continue;
      }

      try {
        const latestCommitDate = await this.#gitHubApiClient.getLatestCommitDate(repository);
        if (!latestCommitDate) {
          continue;
        }

        const calculatedStatus = this.#evaluator.evaluate(latestCommitDate);

        for (const file of localizedFiles) {
          if (file.content.projectsPage?.projects[projectIndex]) {
            file.content.projectsPage.projects[projectIndex].status = calculatedStatus.key;
          }
        }
      } catch (error) {
        console.error(`Failed to synchronize ${currentProject.link}: ${error.message}`);
      }
    }

    await this.#saveLocalizedDatasets(localizedFiles);
  }

  async #loadLocalizedDatasets() {
    return Promise.all(
      this.#supportedLocales.map(async locale => {
        const filePath = path.join(__dirname, `../../data/languages/${locale}/projects.json`);
        const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
        return { filePath, content };
      })
    );
  }

  async #saveLocalizedDatasets(localizedFiles) {
    await Promise.all(
      localizedFiles.map(({ filePath, content }) =>
        fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8')
      )
    );
  }
}