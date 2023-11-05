import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class RemoteSession extends Document {
  @Prop({ type: Object, required: true })
  info: object;
}

export const RemoteSessionSchema = SchemaFactory.createForClass(RemoteSession);
