import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { ISessionRepository, SessionModel } from '@secret-santa/shared';

@Injectable()
export class FirestoreSessionRepository implements ISessionRepository {
  private readonly db: Firestore;
  private readonly collectionName = 'sessions';

  constructor() {
    this.db = new Firestore({ projectId: process.env.GCP_PROJECT_ID });
  }

  async findAll(): Promise<SessionModel[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => doc.data() as SessionModel);
  }

  async findMostRecent(): Promise<SessionModel | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as SessionModel;
  }

  async save(session: SessionModel): Promise<SessionModel> {
    await this.db
      .collection(this.collectionName)
      .doc(session.name)
      .set(session);
    return session;
  }

  async existsByName(name: string): Promise<boolean> {
    const doc = await this.db
      .collection(this.collectionName)
      .doc(name)
      .get();
    return doc.exists;
  }

  async deleteByName(name: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(name).delete();
  }
}
