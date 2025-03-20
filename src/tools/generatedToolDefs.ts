/**
 * 自動生成的工具定義檔案
 * 生成時間: 2025-03-20T05:17:35.002Z
 * 
 * 此檔案由 generateToolDefs.ts 腳本自動生成
 * 請手動檢查並確保每個工具定義正確
 */
import { createToolDefinition } from '../utils/toolRegistration';
import { ToolDefinition } from '../types/tool';

import { createAdvertisement } from './advertisementTools';
import { approveAdvertisement } from './advertisementTools';
import { updateAdvertisementStatus } from './advertisementTools';
import { getBookings } from './bookingTools';
import { createBooking } from './bookingTools';
import { cancelBooking } from './bookingTools';
import { getBusinessHours } from './businessTools';
import { createCategory } from './categoryTools';
import { createCustomer } from './customerTools';
import { getCustomer } from './customerTools';
import { listTools } from './listTools';
import { createMembershipLevel } from './membershipLevelTools';
import { getMembershipLevel } from './membershipLevelTools';
import { assignMembershipLevel } from './membershipLevelTools';
import { createNotification } from './notificationTools';
import { createService } from './serviceTools';
import { getService } from './serviceTools';
import { getAvailableSlots } from './serviceTools';
import { createStaff } from './staffTools';
import { getStaff } from './staffTools';
import { addStaffAvailability } from './staffTools';
import { assignServiceToStaff } from './staffTools';
import { createSubscription } from './subscriptionTools';
import { createUserRelationship } from './userRelationshipTools';
import { getUserRelationship } from './userRelationshipTools';
import { createUser } from './userTools';
import { getSuitableUsersForAdvertisement } from './userTools';

// 工具定義列表
export const generatedToolDefinitions: ToolDefinition[] = [
  // advertisementTools 工具
  createAdvertisement,

  // advertisementTools 工具
  approveAdvertisement,

  // advertisementTools 工具
  updateAdvertisementStatus,

  // bookingTools 工具
  getBookings,

  // bookingTools 工具
  createBooking,

  // bookingTools 工具
  cancelBooking,

  // businessTools 工具
  getBusinessHours,

  // categoryTools 工具
  createCategory,

  // customerTools 工具
  createCustomer,

  // customerTools 工具
  getCustomer,

  // listTools 工具
  listTools,

  // membershipLevelTools 工具
  createMembershipLevel,

  // membershipLevelTools 工具
  getMembershipLevel,

  // membershipLevelTools 工具
  assignMembershipLevel,

  // notificationTools 工具
  createNotification,

  // serviceTools 工具
  createService,

  // serviceTools 工具
  getService,

  // serviceTools 工具
  getAvailableSlots,

  // staffTools 工具
  createStaff,

  // staffTools 工具
  getStaff,

  // staffTools 工具
  addStaffAvailability,

  // staffTools 工具
  assignServiceToStaff,

  // subscriptionTools 工具
  createSubscription,

  // userRelationshipTools 工具
  createUserRelationship,

  // userRelationshipTools 工具
  getUserRelationship,

  // userTools 工具
  createUser,

  // userTools 工具
  getSuitableUsersForAdvertisement,

];
