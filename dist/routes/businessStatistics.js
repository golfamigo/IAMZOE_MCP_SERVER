"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/businessStatistics.ts
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const neo4jUtils_1 = require("../utils/neo4jUtils");
const router = express_1.default.Router();
// 获取日期范围内的商业统计数据 API
router.get('/businesses/:business_id/statistics', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id } = req.params;
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要参数: start_date 和 end_date'
        });
        return;
    }
    try {
        // 验证商家是否存在
        const businessResult = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id });
        if (businessResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的商家'
            });
            return;
        }
        // 验证日期格式
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '日期格式无效，应为 YYYY-MM-DD'
            });
            return;
        }
        // 获取该日期范围内的总收入和预约数
        const summaryQuery = `
      MATCH (b:Booking {business_id: $business_id})
      WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_start_datetime) <= date($end_date)
      OPTIONAL MATCH (b)-[:BOOKS]->(bi:BookableItem)
      WITH b, bi
      RETURN 
        count(b) as total_bookings,
        sum(CASE WHEN bi.bookable_item_price IS NOT NULL THEN bi.bookable_item_price * b.booking_unit_count ELSE 0 END) as total_revenue
    `;
        const summaryResult = await db_1.neo4jClient.runQuery(summaryQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date
        });
        const totalBookings = (0, neo4jUtils_1.toJsNumber)(summaryResult.records[0].get('total_bookings'));
        const totalRevenue = (0, neo4jUtils_1.toJsNumber)(summaryResult.records[0].get('total_revenue'));
        // 获取该日期范围内的新客户数
        const newCustomersQuery = `
      MATCH (c:Customer {business_id: $business_id})
      WHERE date(c.created_at) >= date($start_date) AND date(c.created_at) <= date($end_date)
      RETURN count(c) as new_customers
    `;
        const newCustomersResult = await db_1.neo4jClient.runQuery(newCustomersQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date
        });
        const newCustomers = (0, neo4jUtils_1.toJsNumber)(newCustomersResult.records[0].get('new_customers'));
        // 获取按日期分组的统计数据
        const dailyStatsQuery = `
      MATCH (b:Booking {business_id: $business_id})
      WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_start_datetime) <= date($end_date)
      OPTIONAL MATCH (b)-[:BOOKS]->(bi:BookableItem)
      WITH date(b.booking_start_datetime) as booking_date, b, bi
      RETURN 
        toString(booking_date) as date,
        count(b) as daily_bookings,
        sum(CASE WHEN bi.bookable_item_price IS NOT NULL THEN bi.bookable_item_price * b.booking_unit_count ELSE 0 END) as daily_revenue
      ORDER BY booking_date
    `;
        const dailyStatsResult = await db_1.neo4jClient.runQuery(dailyStatsQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date
        });
        // 获取每日新客户数
        const dailyNewCustomersQuery = `
      MATCH (c:Customer {business_id: $business_id})
      WHERE date(c.created_at) >= date($start_date) AND date(c.created_at) <= date($end_date)
      WITH date(c.created_at) as customer_date, c
      RETURN 
        toString(customer_date) as date,
        count(c) as daily_new_customers
      ORDER BY customer_date
    `;
        const dailyNewCustomersResult = await db_1.neo4jClient.runQuery(dailyNewCustomersQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date
        });
        // 创建日期到新客户数的映射
        const dateToNewCustomers = {};
        dailyNewCustomersResult.records.forEach(record => {
            dateToNewCustomers[record.get('date')] = (0, neo4jUtils_1.toJsNumber)(record.get('daily_new_customers'));
        });
        // 构建日统计数据
        const dailyStatistics = dailyStatsResult.records.map(record => {
            const date = record.get('date');
            return {
                date,
                total_revenue: (0, neo4jUtils_1.toJsNumber)(record.get('daily_revenue')),
                total_bookings: (0, neo4jUtils_1.toJsNumber)(record.get('daily_bookings')),
                new_customers: dateToNewCustomers[date] || 0
            };
        });
        // 构建响应
        const response = {
            start_date: start_date,
            end_date: end_date,
            total_revenue: totalRevenue,
            total_bookings: totalBookings,
            new_customers: newCustomers,
            daily_statistics: dailyStatistics
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('获取商业统计数据时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 获取商业洞察数据 API
router.get('/businesses/:business_id/insights', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id } = req.params;
    const { start_date, end_date, limit = '5' } = req.query;
    if (!start_date || !end_date) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要参数: start_date 和 end_date'
        });
        return;
    }
    try {
        // 验证商家是否存在
        const businessResult = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id });
        if (businessResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的商家'
            });
            return;
        }
        // 验证日期格式
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '日期格式无效，应为 YYYY-MM-DD'
            });
            return;
        }
        const limitValue = parseInt(limit, 10);
        // 获取最受欢迎的服务
        const popularServicesQuery = `
      MATCH (b:Booking {business_id: $business_id})-[:BOOKS]->(bi:BookableItem)
      WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_start_datetime) <= date($end_date)
      WITH bi, count(b) as booking_count, sum(bi.bookable_item_price * b.booking_unit_count) as service_revenue
      RETURN 
        bi.bookable_item_id as bookable_item_id,
        bi.bookable_item_name as bookable_item_name,
        booking_count,
        service_revenue
      ORDER BY booking_count DESC, service_revenue DESC
      LIMIT $limit
    `;
        const popularServicesResult = await db_1.neo4jClient.runQuery(popularServicesQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date,
            limit: limitValue
        });
        // 获取最受欢迎的员工
        const popularStaffQuery = `
      MATCH (s:Staff {business_id: $business_id})<-[:ASSIGNED_TO]-(b:Booking)
      WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_start_datetime) <= date($end_date)
      OPTIONAL MATCH (b)-[:BOOKS]->(bi:BookableItem)
      WITH s, count(b) as booking_count, sum(CASE WHEN bi.bookable_item_price IS NOT NULL THEN bi.bookable_item_price * b.booking_unit_count ELSE 0 END) as staff_revenue
      RETURN 
        s.staff_member_id as staff_member_id,
        s.staff_member_name as staff_member_name,
        booking_count,
        staff_revenue
      ORDER BY booking_count DESC, staff_revenue DESC
      LIMIT $limit
    `;
        const popularStaffResult = await db_1.neo4jClient.runQuery(popularStaffQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date,
            limit: limitValue
        });
        // 获取高峰预约日
        const peakDaysQuery = `
      MATCH (b:Booking {business_id: $business_id})
      WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_start_datetime) <= date($end_date)
      WITH dayOfWeek(b.booking_start_datetime) as day_of_week, count(b) as booking_count
      RETURN day_of_week, booking_count
      ORDER BY booking_count DESC
    `;
        const peakDaysResult = await db_1.neo4jClient.runQuery(peakDaysQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date
        });
        // 获取高峰预约时段
        const peakHoursQuery = `
      MATCH (b:Booking {business_id: $business_id})
      WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_start_datetime) <= date($end_date)
      WITH hour(b.booking_start_datetime) as hour, count(b) as booking_count
      RETURN hour, booking_count
      ORDER BY booking_count DESC
    `;
        const peakHoursResult = await db_1.neo4jClient.runQuery(peakHoursQuery, {
            business_id,
            start_date: start_date,
            end_date: end_date
        });
        // 构建响应
        const insights = {
            popular_services: popularServicesResult.records.map(record => ({
                bookable_item_id: record.get('bookable_item_id'),
                bookable_item_name: record.get('bookable_item_name'),
                booking_count: (0, neo4jUtils_1.toJsNumber)(record.get('booking_count')),
                total_revenue: (0, neo4jUtils_1.toJsNumber)(record.get('service_revenue'))
            })),
            popular_staff: popularStaffResult.records.map(record => ({
                staff_member_id: record.get('staff_member_id'),
                staff_member_name: record.get('staff_member_name'),
                booking_count: (0, neo4jUtils_1.toJsNumber)(record.get('booking_count')),
                total_revenue: (0, neo4jUtils_1.toJsNumber)(record.get('staff_revenue'))
            })),
            peak_booking_days: peakDaysResult.records.map(record => ({
                day_of_week: (0, neo4jUtils_1.toJsNumber)(record.get('day_of_week')),
                booking_count: (0, neo4jUtils_1.toJsNumber)(record.get('booking_count'))
            })),
            peak_booking_hours: peakHoursResult.records.map(record => ({
                hour: (0, neo4jUtils_1.toJsNumber)(record.get('hour')),
                booking_count: (0, neo4jUtils_1.toJsNumber)(record.get('booking_count'))
            }))
        };
        res.status(200).json(insights);
        return;
    }
    catch (error) {
        console.error('获取商业洞察数据时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
exports.default = router;
