/**
 * @fileoverview Domain enum representing strict project lifecycle statuses.
 */
export class ProjectStatus {
  static ACTIVE = new ProjectStatus('active');
  static PAUSED = new ProjectStatus('paused');
  static STOPPED = new ProjectStatus('stopped');
  static COMPLETED = new ProjectStatus('completed');

  static #INSTANCES = Object.freeze({
    active: ProjectStatus.ACTIVE,
    paused: ProjectStatus.PAUSED,
    stopped: ProjectStatus.STOPPED,
    completed: ProjectStatus.COMPLETED
  });

  constructor(name) {
    this.name = name;
    Object.freeze(this);
  }

  get key() {
    return this.name;
  }

  equals(other) {
    return other instanceof ProjectStatus && this.name === other.name;
  }

  static fromKey(key) {
    const status = ProjectStatus.#INSTANCES[key];
    if (!status) {
      throw new IllegalArgumentException(`Unknown project status key: "${key}"`);
    }
    return status;
  }

  toString() {
    return this.name;
  }
}

export class IllegalArgumentException extends Error {
  constructor(message) {
    super(message);
    this.name = 'IllegalArgumentException';
  }
}