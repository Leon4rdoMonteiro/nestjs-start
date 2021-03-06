import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ApiQuery } from '@nestjs/swagger';
import { PrintMessageProducer } from 'src/queues/producers/printMessage.producer';
import { CreateTaskDTO } from './dto/create-task.dto';
import { GetTasksFilterDTO } from './dto/get-tasks-filter.dto';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskRepository) private taskRepository: TaskRepository,
    private printMessageProducer: PrintMessageProducer,
  ) {}

  @ApiQuery({ name: 'filterDTO', type: GetTasksFilterDTO })
  async getTasks(filterDTO: GetTasksFilterDTO): Promise<Task[]> {
    const tasks = await this.taskRepository.getTasks(filterDTO);

    await this.printMessageProducer.printMessage('getTasksRoute');

    return tasks;
  }

  async getTaskById(id: number): Promise<Task> {
    const found = await this.taskRepository.findOne(id);

    if (!found) {
      throw new NotFoundException(`Task with ID: ${id} was not found`);
    }

    return found;
  }

  async createTask(createTaskDTO: CreateTaskDTO): Promise<Task> {
    const task = await this.taskRepository.create({
      ...createTaskDTO,
      status: TaskStatus.OPEN,
    });

    await task.save();

    return task;
  }

  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.getTaskById(id);

    task.status = status;

    await task.save();

    return task;
  }

  async deleteTask(id: number): Promise<void> {
    const result = await this.taskRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID: ${id} was not found`);
    }
  }
}
