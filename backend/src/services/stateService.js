import { config } from "../config.js";
import { readJson, writeJson } from "../utils/fileStore.js";

class StateService {
  load() {
    const state = readJson(config.statePath, {
      initialBudget: config.initialBudget,
      budgetRemaining: config.initialBudget,
      adminPaused: false,
      freezeReason: null,
      requestLog: [],
      activeQueue: [],
      claimOverrides: {}
    });

    if (typeof state.initialBudget !== "number") {
      state.initialBudget = config.initialBudget;
    }

    if (typeof state.budgetRemaining !== "number") {
      state.budgetRemaining = config.initialBudget;
    }

    if (!Array.isArray(state.requestLog)) {
      state.requestLog = [];
    }

    if (!Array.isArray(state.activeQueue)) {
      state.activeQueue = [];
    }

    if (!state.claimOverrides || typeof state.claimOverrides !== "object") {
      state.claimOverrides = {};
    }

    return state;
  }

  save(state) {
    writeJson(config.statePath, state);
  }

  get() {
    return this.load();
  }

  update(mutator) {
    const state = this.load();
    const nextState = mutator(structuredClone(state)) || state;
    this.save(nextState);
    return nextState;
  }
}

export const stateService = new StateService();
