import { config } from "../config.js";
import { readJson, writeJson } from "../utils/fileStore.js";
import { buildLedgerHash } from "../utils/hash.js";

class LedgerService {
  getEntries() {
    return readJson(config.ledgerPath, []);
  }

  saveEntries(entries) {
    writeJson(config.ledgerPath, entries);
  }

  validateChain() {
    const entries = this.getEntries();

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const expectedPreviousHash = index === 0 ? "GENESIS" : entries[index - 1].CurrentHash;
      const expectedCurrentHash = buildLedgerHash({
        ...entry,
        PreviousHash: expectedPreviousHash
      });

      if (entry.PreviousHash !== expectedPreviousHash || entry.CurrentHash !== expectedCurrentHash) {
        return {
          valid: false,
          index,
          expectedPreviousHash,
          expectedCurrentHash,
          actualPreviousHash: entry.PreviousHash,
          actualCurrentHash: entry.CurrentHash
        };
      }
    }

    return { valid: true, index: -1 };
  }

  appendEntry(entryWithoutHashes) {
    const entries = this.getEntries();
    const previousHash = entries.length === 0 ? "GENESIS" : entries[entries.length - 1].CurrentHash;
    const nextEntry = {
      ...entryWithoutHashes,
      PreviousHash: previousHash
    };

    nextEntry.CurrentHash = buildLedgerHash(nextEntry);
    entries.push(nextEntry);
    this.saveEntries(entries);

    return nextEntry;
  }
}

export const ledgerService = new LedgerService();
