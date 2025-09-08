import { ConflictException, Injectable } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { ProductService } from '../product/product.service';
import { Webpage } from '../webpage/entities/webpage.entity';
import { WebpageUtilsService } from '../webpage-utils/webpage-utils.service';
import { DiscordService } from '../discord/discord.service';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert) private alertsRepository: Repository<Alert>,
    private productService: ProductService,
    private webpageUtilsService: WebpageUtilsService,
    private discordService: DiscordService,
  ) { }
  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    console.log(createAlertDto);
    const productEntity = await this.productService.findOne(
      createAlertDto.productId,
    );
    console.log(productEntity);
    try {
      return this.alertsRepository.save({
        name: createAlertDto.name,
        price: createAlertDto.price,
        product: productEntity,
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('alert_already_made_for_user');
    }
  }

  async checkAlert(webpage: Webpage): Promise<boolean> {
    console.log('webpage-updated event fired');

    const alert = await this.findOneByProductId(webpage.shopProduct.product.id);
    if (!alert) return false;
    const isWebpageCheaper = webpage.price <= alert.price;
    if (
      isWebpageCheaper &&
      webpage.inStock === true &&
      webpage.price > 0.01 &&
      webpage.disable === false
    ) {
      alert.alerted = true;
      console.log({
        websiteUrl: webpage.url,
        cheaper: isWebpageCheaper,
        inStock: webpage.inStock,
        price: webpage.price,
        logic: webpage.price > 0,
      });

      await this.alertsRepository.save(alert);
      console.log('Alert Triggered');
      await this.discordService.sendAlert(
        `${alert.name} Triggered`,
        webpage.url,
      );
      return true;
    } else {
      console.log({
        cheaper: isWebpageCheaper,
        inStock: webpage.inStock,
      });
      return false;
    }
  }

  async shallowUpdateAlerts(): Promise<void> {
    const webpages = await this.webpageUtilsService.findAll();
    webpages.forEach(async (webpage) => {
      await this.checkAlert(webpage);
    });
  }

  async resetAlerts(): Promise<Alert[]> {
    const alerts = await this.findAll();
    alerts.forEach((alert) => (alert.alerted = false));
    return this.alertsRepository.save(alerts);
  }

  async findAll(): Promise<Alert[]> {
    return this.alertsRepository.find({});
  }

  async findAllState(state: boolean): Promise<Alert[]> {
    return this.alertsRepository.find({
      where: {
        alerted: state,
      },
      relations: {
        product: true,
      },
    });
  }

  async findOne(id: string): Promise<Alert> {
    return this.alertsRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findOneByProductId(productId: string): Promise<Alert> {
    return this.alertsRepository.findOne({
      where: {
        product: {
          id: productId,
        },
      },
    });
  }

  async update(id: string, updateAlertDto: UpdateAlertDto): Promise<UpdateResult> {
    return this.alertsRepository.update(id, updateAlertDto);
  }

  async remove(id: string): Promise<DeleteResult> {
    return this.alertsRepository.delete(id)
  }
}
