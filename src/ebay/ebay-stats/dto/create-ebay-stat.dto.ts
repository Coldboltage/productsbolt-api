import { createZodDto } from "nestjs-zod";
import { CreateEbayStatSchema } from "../ebay-stats-schema";


export class CreateEbayStatDto extends createZodDto(CreateEbayStatSchema) {}
