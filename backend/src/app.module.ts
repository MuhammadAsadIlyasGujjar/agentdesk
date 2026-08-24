import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/message.entity';
import { ToolRun } from './entities/tool-run.entity';

import { AgentModule } from './agent/agent.module';
import { CatalogModule } from './catalog/catalog.module';
import { SeedModule } from './seed/seed.module';

/**
 * ⚠️ SEEKHNE WALI BAAT — entities ki registration
 *
 * Pehle yahan `autoLoadEntities: true` tha. Wo sirf un entities ko uthata hai
 * jo kisi `TypeOrmModule.forFeature([...])` mein likhi hon.
 *
 * `OrderItem` kahin forFeature mein nahi thi (uska apna repository kisi ko
 * chahiye hi nahi tha — wo `Order` ke cascade se save hoti hai). Nateeja:
 *
 *     TypeORMError: Entity metadata for Order#items was not found
 *
 * Isliye entities ki list yahan SAAF LIKHI hui hai. Ye zyada mehnat lagti hai
 * magar aisi silent missing-entity ghalti nahi hone deti.
 */

@Module({
  imports: [
    // .env root folder se bhi padho aur backend folder se bhi
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER') ?? config.get<string>('POSTGRES_USER') ?? 'agent',
        password: config.get<string>('DB_PASSWORD') ?? config.get<string>('POSTGRES_PASSWORD') ?? 'agent123',
        database: config.get<string>('DB_NAME') ?? config.get<string>('POSTGRES_DB') ?? 'agentdesk',


        entities: [Product, Order, OrderItem, Conversation, ChatMessage, ToolRun],

        // ⚠️ synchronize=true DEV ke liye hai — TypeORM khud tables banata hai.
        // Production mein isay false karke migrations use karein, warna
        // ek galat entity change poora table drop kar sakta hai.
        synchronize: (config.get<string>('DB_SYNCHRONIZE') ?? 'true') === 'true',
        logging: (config.get<string>('DB_LOGGING') ?? 'false') === 'true',

        // Docker mein DB thoda late ready hota hai — retry kar lo
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),

    AgentModule,
    CatalogModule,
    SeedModule,
  ],
})
export class AppModule {}
