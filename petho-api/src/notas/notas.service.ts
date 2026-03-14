import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotaManual } from './entities/nota-manual.entity';

@Injectable()
export class NotasService {
  constructor(
    @InjectRepository(NotaManual)
    private readonly notaRepo: Repository<NotaManual>,
  ) {}

  async findAll(idDropi?: string): Promise<NotaManual[]> {
    if (idDropi) {
      return this.notaRepo.findBy({ id_dropi: idDropi });
    }
    return this.notaRepo.find();
  }

  async findOne(id: number): Promise<NotaManual> {
    const nota = await this.notaRepo.findOneBy({ id });
    if (!nota)
      throw new NotFoundException(`Nota con ID ${id} no encontrada`);
    return nota;
  }

  async create(data: Partial<NotaManual>): Promise<NotaManual> {
    const nota = this.notaRepo.create(data);
    return this.notaRepo.save(nota);
  }

  async update(id: number, data: Partial<NotaManual>): Promise<NotaManual> {
    const nota = await this.findOne(id);
    Object.assign(nota, data);
    return this.notaRepo.save(nota);
  }

  async remove(id: number): Promise<void> {
    const nota = await this.findOne(id);
    await this.notaRepo.remove(nota);
  }

  async bulkUpsert(records: Partial<NotaManual>[]): Promise<number> {
    let count = 0;
    for (const record of records) {
      await this.notaRepo.save(this.notaRepo.create(record));
      count++;
    }
    return count;
  }
}
