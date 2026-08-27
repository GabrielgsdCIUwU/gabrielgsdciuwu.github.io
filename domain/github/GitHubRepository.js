/**
 * @fileoverview Value object representing a GitHub repository identifier.
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

  static fromUrl(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    const match = url.trim().match(GitHubRepository.#GITHUB_URL_PATTERN);
    if (!match) {
      return null;
    }

    return new GitHubRepository(match[1], match[2]);
  }
}