import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BaseRepository<ModelType> {
  constructor(public readonly baseModel: Model<ModelType>) {}

  async insertOne(data: Record<string, any>) {
    const result = new this.baseModel(data);
    return await result.save();
  }

  async findOne(keys: Record<string, string | number>) {
    const result = await this.baseModel.findOne(keys);
    return result;
  }

  async find(keys: Record<string, string | number>) {
    const result = await this.baseModel.find(keys);
    return result;
  }
}
