import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';
import { BcryptUtility } from '../utils/bcrypt.utils';
import { bcryptConfig } from '../config/bcrypt';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends Document {
  @Prop()
  firstName: string;
  @Prop()
  lastName: string;
  @Prop()
  email: string;
  @Prop()
  password: string;

  public hashPassword: Function;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.hashPassword = async function (
  incomingPassword: string
): Promise<string> {
  return await BcryptUtility.generateHash(
    incomingPassword,
    bcryptConfig.salt_rounds
  );
};

UserSchema.pre<User>('save', async function (next) {
  const user: User = this;
  if (user.password) {
    user.password = await user.hashPassword(user.password);
    next();
  }
});

export { UserSchema };
