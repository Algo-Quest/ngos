import * as bcrypt from "bcrypt";

type getReturnTypeGenerateHash = Promise<string>;

export class BcryptUtility {
  public static async generateHash(
    password: string,
    saltOrRounds: number
  ): getReturnTypeGenerateHash {
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);
    return hashedPassword;
  }

  public static async compare(password: string, userPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, userPassword);
  }
}
