export class UserSessionStore {
  constructor() {
    this.map = new Map(); // discordUserId -> firestoreUserId
  }
  set(discordId, userId) {
    this.map.set(discordId, userId);
  }
  get(discordId) {
    return this.map.get(discordId);
  }
  entries() {
    return this.map.entries();
  }
  size() {
    return this.map.size;
  }
}
