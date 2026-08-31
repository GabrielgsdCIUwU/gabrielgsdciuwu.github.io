import { ProjectStatus } from './ProjectStatus.js';

/**
 * @fileoverview Domain service that classifies project status based on commit inactivity thresholds.
 */
export class ProjectStatusEvaluator {
  static #DAYS_PER_MONTH = 30.4375;
  static #NINE_MONTHS_DAYS = 9 * ProjectStatusEvaluator.#DAYS_PER_MONTH;
  static #EIGHTEEN_MONTHS_DAYS = 18 * ProjectStatusEvaluator.#DAYS_PER_MONTH;
  static #THREE_YEARS_DAYS = 36 * ProjectStatusEvaluator.#DAYS_PER_MONTH;

  evaluate(lastCommitDate, referenceDate = new Date()) {
    if (!lastCommitDate) {
      return ProjectStatus.COMPLETED;
    }

    const elapsedDays = this.#calculateElapsedDays(new Date(lastCommitDate), referenceDate);

    if (elapsedDays > ProjectStatusEvaluator.#THREE_YEARS_DAYS) {
      return ProjectStatus.COMPLETED;
    }

    if (elapsedDays > ProjectStatusEvaluator.#EIGHTEEN_MONTHS_DAYS) {
      return ProjectStatus.STOPPED;
    }

    if (elapsedDays > ProjectStatusEvaluator.#NINE_MONTHS_DAYS) {
      return ProjectStatus.PAUSED;
    }

    return ProjectStatus.ACTIVE;
  }

  #calculateElapsedDays(targetDate, referenceDate) {
    const elapsedMilliseconds = referenceDate.getTime() - targetDate.getTime();
    return elapsedMilliseconds / (1000 * 60 * 60 * 24);
  }
}