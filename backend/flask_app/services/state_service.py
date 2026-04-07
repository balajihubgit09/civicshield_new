from copy import deepcopy
from flask import current_app

from ..utils.file_store import read_json, write_json


class StateService:
    def load(self):
        config = current_app.config
        state = read_json(
            config["STATE_PATH"],
            {
                "initialBudget": config["INITIAL_BUDGET"],
                "budgetRemaining": config["INITIAL_BUDGET"],
                "adminPaused": False,
                "freezeReason": None,
                "requestLog": [],
                "activeQueue": [],
                "claimOverrides": {},
            },
        )

        if not isinstance(state.get("initialBudget"), (int, float)):
            state["initialBudget"] = config["INITIAL_BUDGET"]

        if not isinstance(state.get("budgetRemaining"), (int, float)):
            state["budgetRemaining"] = config["INITIAL_BUDGET"]

        if not isinstance(state.get("requestLog"), list):
            state["requestLog"] = []

        if not isinstance(state.get("activeQueue"), list):
            state["activeQueue"] = []

        if not isinstance(state.get("claimOverrides"), dict):
            state["claimOverrides"] = {}

        return state

    def save(self, state):
        write_json(current_app.config["STATE_PATH"], state)

    def get(self):
        return self.load()

    def update(self, mutator):
        state = self.load()
        next_state = mutator(deepcopy(state))
        if next_state is None:
            next_state = state
        self.save(next_state)
        return next_state


state_service = StateService()
