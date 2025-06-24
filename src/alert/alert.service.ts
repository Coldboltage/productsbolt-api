import { ConflictException, Injectable } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import { UserService } from '../user/user.service';
import { WebpageService } from '../webpage/webpage.service';
import { Webpage } from '../webpage/entities/webpage.entity';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert) private alertsRepository: Repository<Alert>,
    private userService: UserService,
    private productService: ProductService,
    private webPagesService: WebpageService,
  ) { }
  async create(createAlertDto: CreateAlertDto) {
    const userEntity = await this.userService.findOneByEmail(
      createAlertDto.email,
    );
    const productEntity = await this.productService.findOne(
      createAlertDto.productId,
    );
    try {
      const alertEntity = await this.alertsRepository.save({
        name: createAlertDto.name,
        price: createAlertDto.priceAlert,
        product: productEntity,
        user: userEntity,
      });
      return alertEntity;
    } catch (error) {
      throw new ConflictException('alert_already_made_for_user');
    }
  }

  async showAllWebpagesForAlert(id: string): Promise<Webpage[]> {
    const alertEntity = await this.findOne(id);
    const webPagesList = await this.webPagesService.findAllByProduct(
      alertEntity.id,
    );
    console.log(webPagesList);
    return webPagesList
  }

  findAll() {
    return `This action returns all alert`;
  }

  findOne(id: string) {
    return this.alertsRepository.findOne({
      where: {
        id,
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
