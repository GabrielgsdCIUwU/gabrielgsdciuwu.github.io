import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitHubRepository } from '../../domain/github/GitHubRepository.js';
import { ProjectStatus } from '../../domain/projects/ProjectStatus.js';
import { ProjectStatusEvaluator } from '../../domain/projects/ProjectStatusEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @fileoverview Application service that synchronizes repositories and sorts them by status priority and newest activity date.
 */
export class ProjectsSynchronizer {
  #gitHubApiClient;
  #evaluator;
  #defaultLocaleStatuses;

  constructor(gitHubApiClient, evaluator = new ProjectStatusEvaluator()) {
    this.#gitHubApiClient = gitHubApiClient;
    this.#evaluator = evaluator;
    this.#defaultLocaleStatuses = {
      es: {
        active: 'Activo',
        paused: 'Pausado',
        stopped: 'Detenido',
        completed: 'Finalizado'
      },
      en: {
        active: 'Active',
        paused: 'Paused',
        stopped: 'Stopped',
        completed: 'Completed'
      }
    };
  }

  async synchronize() {
    const supportedLocales = Object.keys(this.#defaultLocaleStatuses);
    const localizedDatasets = await this.#loadDatasets(supportedLocales);

    this.#ensureStatusDictionaries(localizedDatasets);

    const primaryDataset = localizedDatasets.find(d => d.locale === 'es') || localizedDatasets[0];
    const projectsList = primaryDataset.data.projectsPage.projects;

    const evaluatedProjectsMetadata = [];

    for (let index = 0; index < projectsList.length; index++) {
      const project = projectsList[index];
      const repository = GitHubRepository.fromProject(project);

      let resolvedStatus = ProjectStatus.fromKey(project.status);
      let latestCommitTimestamp = 0;

      if (repository) {
        try {
          const commitInfo = await this.#gitHubApiClient.getLatestCommitInfo(repository);

          if (commitInfo) {
            resolvedStatus = this.#evaluator.evaluate(commitInfo.date);
            latestCommitTimestamp = commitInfo.date.getTime();

            console.log(
              `✔ [${project.name}] Source: ${commitInfo.source} | Date: ${commitInfo.date.toISOString().split('T')[0]} -> Status: ${resolvedStatus.key}`
            );
          }
        } catch (error) {
          console.error(`❌ [${project.name}] Error: ${error.message}`);
        }
      }

      evaluatedProjectsMetadata.push({
        originalIndex: index,
        name: project.name,
        status: resolvedStatus,
        lastCommitTimestamp: latestCommitTimestamp
      });
    }

    evaluatedProjectsMetadata.sort((projectA, projectB) => {
      const statusComparison = projectA.status.compareTo(projectB.status);
      if (statusComparison !== 0) {
        return statusComparison;
      }

      const dateComparison = projectB.lastCommitTimestamp - projectA.lastCommitTimestamp;
      if (dateComparison !== 0) {
        return dateComparison;
      }

      return projectA.originalIndex - projectB.originalIndex;
    });

    for (const dataset of localizedDatasets) {
      const currentProjects = dataset.data.projectsPage.projects;

      const reorderedProjects = evaluatedProjectsMetadata.map(meta => {
        const projectData = { ...currentProjects[meta.originalIndex] };
        projectData.status = meta.status.key;
        return projectData;
      });

      dataset.data.projectsPage.projects = reorderedProjects;
    }

    await this.#saveDatasets(localizedDatasets);
  }

  #ensureStatusDictionaries(datasets) {
    for (const dataset of datasets) {
      if (!dataset.data.projectsPage) {
        dataset.data.projectsPage = {};
      }
      dataset.data.projectsPage.statuses = {
        ...this.#defaultLocaleStatuses[dataset.locale],
        ...(dataset.data.projectsPage.statuses || {})
      };
    }
  }

  async #loadDatasets(locales) {
    return Promise.all(
      locales.map(async locale => {
        const filePath = path.join(__dirname, `../../data/languages/${locale}/projects.json`);
        const content = await fs.readFile(filePath, 'utf8');
        return {
          locale,
          filePath,
          data: JSON.parse(content)
        };
      })
    );
  }

  async #saveDatasets(datasets) {
    await Promise.all(
      datasets.map(({ filePath, data }) =>
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
      )
    );
  }
}