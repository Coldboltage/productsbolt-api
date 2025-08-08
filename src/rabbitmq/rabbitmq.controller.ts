import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { CreateRabbitmqDto } from './dto/create-rabbitmq.dto';
import { UpdateRabbitmqDto } from './dto/update-rabbitmq.dto';

@Controller('rabbitmq')
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @Post()
  create(@Body() createRabbitmqDto: CreateRabbitmqDto) {
    return this.rabbitmqService.create(createRabbitmqDto);
  }

  @Get()
  findAll() {
    return this.rabbitmqService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rabbitmqService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRabbitmqDto: UpdateRabbitmqDto,
  ) {
    return this.rabbitmqService.update(+id, updateRabbitmqDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rabbitmqService.remove(+id);
  }
}
