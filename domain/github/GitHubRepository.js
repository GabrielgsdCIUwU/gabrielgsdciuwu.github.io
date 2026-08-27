/**
 * @fileoverview Value object representing a GitHub repository identifier extracted from various URL fields.
 */
export class GitHubRepository {
  static #GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)(?:\/.*)?$/;

  constructor(owner, name) {
    if (!owner || !name) {
      throw new Error('Repository owner and name are required');
    }
    this.owner = owner;
    this.name = name.replace(/\.git$/, '');
    Object.freeze(this);
  }

  static fromProject(project) {
    const candidateUrl = project.repoLink || project.github || project.link;
    if (!candidateUrl || typeof candidateUrl !== 'string') {
      return null;
    }

    const match = candidateUrl.trim().match(GitHubRepository.#GITHUB_URL_PATTERN);
    if (!match) {
      return null;
    }

    return new GitHubRepository(match[1], match[2]);
  }
}