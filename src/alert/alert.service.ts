import { ConflictException, Injectable } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import { Webpage } from '../webpage/entities/webpage.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { WebpageUtilsService } from '../webpage-utils/webpage-utils.service';
import { DiscordService } from '../discord/discord.service';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert) private alertsRepository: Repository<Alert>,
    // private userService: UserService,
    private productService: ProductService,
    private webpageUtilsService: WebpageUtilsService,
    private discordService: DiscordService,
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

    // console.log('Alert Triggered');
    // await this.discordService.sendAlert(`Test Triggered`, webpage.url);

    const alert = await this.findOneByProductId(webpage.shopProduct.product.id);
    if (!alert) return false;
    const isWebpageCheaper = webpage.price <= alert.price;
    if (isWebpageCheaper && webpage.inStock === true && webpage.price > 0.01) {
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
    } else {
      console.log({
        cheaper: isWebpageCheaper,
        inStock: webpage.inStock,
      });
    }
  }

  async shallowUpdateAlerts() {
    const webpages = await this.webpageUtilsService.findAll();
    webpages.forEach(async (webpage) => {
      await this.checkAlert(webpage);
    });
    return true;
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
