import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CpaService } from './cpa.service';
import { CreateCpaDto } from './dto/create-cpa.dto';
import { UpdateCpaDto } from './dto/update-cpa.dto';

@Controller('cpa')
export class CpaController {
  constructor(private readonly cpaService: CpaService) {}

  @Post()
  create(@Body() createCpaDto: CreateCpaDto) {
    return this.cpaService.create(createCpaDto);
  }

  @Get('stats')
  getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cpaService.getDashboardStats(startDate, endDate);
  }

  @Get()
  findAll() {
    return this.cpaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cpaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCpaDto: UpdateCpaDto) {
    return this.cpaService.update(+id, updateCpaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cpaService.remove(+id);
  }
}
