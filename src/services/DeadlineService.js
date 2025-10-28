import { getFirestore } from '../firestore/FirestoreClient.js';
import { startEndUtcForLocalDate } from '../utils/time.js';

export class DeadlineService {
  constructor() {
    this.db = getFirestore();
  }

  async getCourseName(userId, courseId) {
    try {
      const snap = await this.db
        .collection('users')
        .doc(userId)
        .collection('courses')
        .doc(courseId)
        .get();
      return snap.exists
        ? snap.data().name || 'Unnamed Course'
        : 'Unknown Course';
    } catch {
      return 'Unknown Course';
    }
  }

  async fetchDeadlinesForUserOnDate(userId, localDateJs) {
    const { startUtc, endUtc } = startEndUtcForLocalDate(localDateJs);

    const q = this.db
      .collection('users')
      .doc(userId)
      .collection('deadlines')
      .where('status', '==', 'todo')
      .where('dueAt', '>=', startUtc)
      .where('dueAt', '<=', endUtc);

    const snapshot = await q.get();
    const items = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!(data.dueAt instanceof Date)) continue;
      const courseName = data.courseId
        ? await this.getCourseName(userId, data.courseId)
        : 'Unknown Course';
      items.push({
        id: doc.id,
        title: data.title || 'Untitled',
        courseName,
        dueAt: data.dueAt,
      });
    }

    return items.sort((a, b) => a.dueAt - b.dueAt);
  }
}
