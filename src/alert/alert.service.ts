import { ConflictException, Injectable } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import { Webpage } from '../webpage/entities/webpage.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert) private alertsRepository: Repository<Alert>,
    // private userService: UserService,
    private productService: ProductService,
  ) { }
  async create(createAlertDto: CreateAlertDto) {
    console.log(createAlertDto);
    // const userEntity = await this.userService.findOneByEmail(
    //   createAlertDto.email,
    // );
    const productEntity = await this.productService.findOne(
      createAlertDto.productId,
    );
    console.log(productEntity);
    try {
      const alertEntity = await this.alertsRepository.save({
        name: createAlertDto.name,
        price: createAlertDto.price,
        product: productEntity,
        // user: userEntity,
      });
      return alertEntity;
    } catch (error) {
      console.log(error);
      throw new ConflictException('alert_already_made_for_user');
    }
  }

  @OnEvent('webpage.updated')
  async checkAlert(webpage: Webpage) {
    console.log('webpage-updated event fired');

    const alert = await this.findOneByProductId(webpage.shopProduct.product.id);
    if (!alert) return false;
    const isWebpageCheaper = webpage.price <= alert.price;
    if (isWebpageCheaper && webpage.inStock === true && webpage.price !== 0) {
      alert.alerted = true;
      await this.alertsRepository.save(alert);
    } else {
      console.log({
        cheaper: isWebpageCheaper,
        inStock: webpage.inStock,
      });
    }
  }

  async resetAlerts() {
    const alerts = await this.findAll();
    alerts.forEach((alert) => (alert.alerted = false));
    const updatedAlerts = await this.alertsRepository.save(alerts);
    return updatedAlerts;
  }

  async findAll() {
    return this.alertsRepository.find({});
  }

  async findAllState(state: boolean) {
    return this.alertsRepository.find({
      where: {
        alerted: state,
      },
      relations: {
        product: true,
      },
    });
  }

  findOne(id: string) {
    return this.alertsRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findOneByProductId(productId: string) {
    return this.alertsRepository.findOne({
      where: {
        product: {
          id: productId,
        },
      },
    });
  }

  update(id: number, updateAlertDto: UpdateAlertDto) {
    return `This action updates a #${id} alert`;
  }

  remove(id: number) {
    return `This action removes a #${id} alert`;
  }
}
