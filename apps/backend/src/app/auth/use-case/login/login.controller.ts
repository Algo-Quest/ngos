import {
  Body,
  ConflictException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LocalAuthGuard } from '../../guard/local';
import { JwtService } from '@nestjs/jwt';

@Controller('login')
export class LoginController {
  constructor(private readonly _jwtService: JwtService) {}

  @UseGuards(LocalAuthGuard)
  @Post()
  async login(@Req() req, @Body() user) {
    //stored by passport in request session
    // console.log(req.user);
    return {
      accessToken: this._jwtService.sign(req.user),
    };
  }
}
