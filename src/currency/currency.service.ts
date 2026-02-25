import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency, ExchangeRatesResponse } from './entities/currency.entity';
import { Repository } from 'typeorm';
import { ShopService } from 'src/shop/shop.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    private shopService: ShopService,
  ) {}
  create(createCurrencyDto: CreateCurrencyDto) {
    return this.currencyRepository.save(createCurrencyDto);
  }

  async existsOrCreate(createCurrencyDto: CreateCurrencyDto) {
    // Check to see if the currency exists already
    const doesCurrencyExist = await this.currencyRepository.findOne({
      where: {
        baseCurrency: createCurrencyDto.baseCurrency,
        comparedCurrency: createCurrencyDto.comparedCurrency,
      },
    });

    if (doesCurrencyExist) {
      console.log(`${doesCurrencyExist} exists`);
      const result = await this.update(doesCurrencyExist.id, createCurrencyDto);
      console.log(result);
    } else {
      const result = await this.create(createCurrencyDto);
      console.log(result);
      return result;
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async addAllCurrencies(baseCurrency: string) {
    // Need to get all the currencies that'll matter
    const uniqueCurrencies = await this.shopService.getAllCurrencies();
    const createCurrencyString = uniqueCurrencies.join(',');
    const url = new URL(
      `https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.CURRENCY_KEY}&currencies=${createCurrencyString}&base_currency=${baseCurrency}`,
    );

    console.log(uniqueCurrencies, createCurrencyString, url);

    const currencyConversionsResponse = await fetch(url);
    const currencyConversionsJson =
      (await currencyConversionsResponse.json()) as ExchangeRatesResponse;

    console.log(
      uniqueCurrencies,
      createCurrencyString,
      url,
      currencyConversionsJson,
    );

    for (const currency of uniqueCurrencies) {
      const rate = currencyConversionsJson.data[currency];

      const create: CreateCurrencyDto = {
        baseCurrency,
        comparedCurrency: currency,
        value: rate,
      };
      await this.existsOrCreate(create);
    }
  }

  findAll() {
    return this.currencyRepository.find({});
  }

  findOne(id: string) {
    return this.currencyRepository.findOne({
      where: {
        id,
      },
    });
  }

  findOneByBaseAndCompare(baseCurrency: string, comparedCurrency: string) {
    return this.currencyRepository.findOne({
      where: {
        baseCurrency,
        comparedCurrency,
      },
    });
  }

  async update(id: string, updateCurrencyDto: UpdateCurrencyDto) {
    return this.currencyRepository.update(id, updateCurrencyDto);
  }

  async remove(id: string) {
    const currencyEntity = await this.findOne(id);
    if (!currencyEntity) throw new NotFoundException(`currency_not_found`);

    return this.currencyRepository.remove(currencyEntity);
  }
}
