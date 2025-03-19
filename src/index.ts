import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import dotenv from 'dotenv';
import { neo4jClient } from './db';

// 導入路由
import bookingsRouter from './routes/bookings';
import customersRouter from './routes/customers';
import staffRouter from './routes/staff';
import servicesRouter from './routes/services';
import categoriesRouter from './routes/categories';
import membershipLevelsRouter from './routes/membershipLevels';
import advertisementsRouter from './routes/advertisements';
import userRelationshipsRouter from './routes/userRelationships';
import staffAvailabilityRouter from './routes/staffAvailability';
import notificationsRouter from './routes/notifications';
import subscriptionsRouter from './routes/subscriptions';
import businessRouter from './routes/business';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 註冊API路由
app.use('/api/v1', bookingsRouter);
app.use('/api/v1', customersRouter);
app.use('/api/v1', staffRouter);
app.use('/api/v1', servicesRouter);
app.use('/api/v1', categoriesRouter);
app.use('/api/v1', membershipLevelsRouter);
app.use('/api/v1', advertisementsRouter);
app.use('/api/v1', userRelationshipsRouter);
app.use('/api/v1', staffAvailabilityRouter);
app.use('/api/v1', notificationsRouter);
app.use('/api/v1', subscriptionsRouter);
app.use('/api/v1', businessRouter);
app.use('/api/v1', usersRouter);

// MCP Server 工具實現
interface Booking {
  booking_id: string;
  business_id: string;
  booking_start_datetime: string;
  booking_end_datetime: string;
  booking_status_code: string;
  booking_unit_count: number;
  created_at: string;
  updated_at: string;
}

interface GetBookingsParams {
  business_id: string;
}

interface CreateBookingParams {
  business_id: string;
  bookable_item_id: string;
  start_datetime: string;
  end_datetime: string;
  unit_count: number;
}

interface CreateBookingResult {
  booking_id: string;
}

const tools = {
  getBookings: async (params: GetBookingsParams): Promise<Booking[]> => {
    const { business_id } = params;
    const result = await neo4jClient.runQuery(
      'MATCH (b:Booking {business_id: $business_id}) RETURN b LIMIT 10',
      { business_id }
    );
    return result.records.map(record => record.get('b').properties);
  },
  createBooking: async (params: CreateBookingParams): Promise<CreateBookingResult> => {
    const { business_id, bookable_item_id, start_datetime, end_datetime, unit_count } = params;
    const booking_id = require('uuid').v4();
    const result = await neo4jClient.runQuery(
      `CREATE (b:Booking {
        booking_id: $booking_id,
        business_id: $business_id,
        booking_start_datetime: datetime($start_datetime),
        booking_end_datetime: datetime($end_datetime),
        booking_status_code: 'pending',
        booking_unit_count: $unit_count,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN b`,
      { booking_id, business_id, start_datetime, end_datetime, unit_count }
    );
    return { booking_id };
  }
};

const server = new Server(
  { name: 'iamzoe-mcp-server', version: '1.0.0' },
  { capabilities: { tools } } // 加入工具
);

server.onerror = (error) => console.error('[MCP Error]', error);

interface ErrorResponse {
  error_code: string;
  message: string;
}

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局錯誤處理:', err);
  res.status(500).json({
    error_code: 'SERVER_ERROR',
    message: '伺服器發生錯誤'
  } as ErrorResponse);
});

(async () => {
  try {
    await neo4jClient.connect();
    process.on('SIGINT', async () => {
      console.log('正在關閉應用程式...');
      await server.close();
      await neo4jClient.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Server 已啟動');

    app.listen(port, () => {
      console.log(`Express 應用程式監聽於 port ${port}`);
      console.log(`API 基礎路徑: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    console.error('啟動應用程式時發生錯誤:', error);
    process.exit(1);
  }
})();