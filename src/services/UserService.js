import { getFirestore } from '../firestore/FirestoreClient.js';

export class UserService {
  constructor() {
    this.db = getFirestore();
  }

  async findUserByEmail(email) {
    const qs = await this.db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    if (qs.empty) return null;
    const doc = qs.docs[0];
    return { id: doc.id, data: doc.data() };
  }

  async updateDiscordLink(userId, discordId, discordTag) {
    await this.db.collection('users').doc(userId).update({
      discordId,
      discordTag,
    });
  }
}
