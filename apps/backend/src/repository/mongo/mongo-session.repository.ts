import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ISessionRepository } from '@secret-santa/shared';
import { SessionModel } from '@secret-santa/shared';
import { Session, SessionDocument } from './session.schema';

@Injectable()
export class MongoSessionRepository implements ISessionRepository {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async findAll(): Promise<SessionModel[]> {
    const docs = await this.sessionModel.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toModel(doc));
  }

  async findMostRecent(): Promise<SessionModel | null> {
    const doc = await this.sessionModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();
    if (!doc) return null;
    return this.toModel(doc);
  }

  async save(session: SessionModel): Promise<SessionModel> {
    const created = await this.sessionModel.create(session);
    return this.toModel(created);
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.sessionModel.countDocuments({ name }).exec();
    return count > 0;
  }

  async deleteByName(name: string): Promise<void> {
    await this.sessionModel.deleteOne({ name }).exec();
  }

  private toModel(doc: SessionDocument): SessionModel {
    return {
      name: doc.name,
      createdAt: doc.createdAt,
      pairs: doc.pairs,
      participants: doc.participants,
    };
  }
}
