// 首先定義工具名稱列表
export const toolNames = [
  'listTools',
  'getBookings',
  'createBooking',
  'cancelBooking',
  'getAvailableSlots',
  'getBusinessHours',
  'createCustomer',
  'getCustomer',
  'updateCustomer',
  'listCustomers',
  'createStaff',
  'getStaff',
  'updateStaff',
  'listStaff',
  'addStaffAvailability',
  'assignServiceToStaff',
  'createService',
  'getService',
  'updateService',
  'listServices',
  'createCategory',
  'getCategory',
  'updateCategory',
  'listCategories',
  'createMembershipLevel',
  'getMembershipLevel',
  'assignMembershipLevel',
  'updateMembershipLevel',
  'listMembershipLevels',
  'createAdvertisement',
  'getAdvertisement',
  'approveAdvertisement',
  'updateAdvertisementStatus',
  'updateAdvertisement',
  'listAdvertisements',
  'createUserRelationship',
  'getUserRelationship',
  'updateUserRelationship',
  'listUserRelationships',
  'getSuitableUsersForAdvertisement'
];

// 現在導入各個工具模塊
import { listTools } from './listTools';
import { bookingTools } from './bookingTools';
import { businessTools } from './businessTools';
import { categoryTools } from './categoryTools';
import { customerTools } from './customerTools';
import { serviceTools } from './serviceTools';
import { staffTools } from './staffTools';
import { membershipLevelTools } from './membershipLevelTools';
import { userRelationshipTools } from './userRelationshipTools';
import { notificationTools } from './notificationTools';
import { subscriptionTools } from './subscriptionTools';
import { userTools } from './userTools';
import { advertisementTools } from './advertisementTools';

// 導出所有工具
export const tools = {
  // 工具列表工具
  listTools,
  
  // 預約相關工具
  ...bookingTools,
  
  // 商家相關工具
  ...businessTools,
  
  // 類別相關工具
  ...categoryTools,
  
  // 顧客相關工具
  ...customerTools,
  
  // 服務相關工具
  ...serviceTools,
  
  // 員工相關工具
  ...staffTools,
  
  // 會員等級相關工具
  ...membershipLevelTools,
  
  // 使用者關係相關工具
  ...userRelationshipTools,
  
  // 通知相關工具
  ...notificationTools,
  
  // 訂閱相關工具
  ...subscriptionTools,
  
  // 使用者相關工具
  ...userTools,
  
  // 廣告相關工具
  ...advertisementTools
};
