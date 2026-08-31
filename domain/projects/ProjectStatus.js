/**
 * @fileoverview Domain enum representing project lifecycle statuses with hierarchical ordering.
 */
export class ProjectStatus {
  static ACTIVE = new ProjectStatus('active', 1);
  static PAUSED = new ProjectStatus('paused', 2);
  static STOPPED = new ProjectStatus('stopped', 3);
  static COMPLETED = new ProjectStatus('completed', 4);

  static #INSTANCES = Object.freeze({
    active: ProjectStatus.ACTIVE,
    paused: ProjectStatus.PAUSED,
    stopped: ProjectStatus.STOPPED,
    completed: ProjectStatus.COMPLETED
  });

  constructor(name, priority) {
    this.name = name;
    this.priority = priority;
    Object.freeze(this);
  }

  get key() {
    return this.name;
  }

  compareTo(other) {
    if (!(other instanceof ProjectStatus)) {
      return 0;
    }
    return this.priority - other.priority;
  }

  equals(other) {
    return other instanceof ProjectStatus && this.name === other.name;
  }

  static fromKey(key) {
    const status = ProjectStatus.#INSTANCES[key];
    if (!status) {
      return ProjectStatus.COMPLETED;
    }
    return status;
  }

  toString() {
    return this.name;
  }
}