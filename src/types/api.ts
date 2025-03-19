import { UUID } from "crypto";

// 通用錯誤響應類型
export interface ErrorResponse {
  error_code: string;
  message: string;
}

// 預約相關類型定義
export interface CreateBookingRequest {
  business_id: string;
  bookable_item_id: string;
  booking_start_datetime: string;
  booking_end_datetime: string;
  booking_unit_count: number;
}

export interface CreateBookingResponse {
  booking_id: string;
}

export interface AvailableSlot {
  start_datetime: string;
  end_datetime: string;
}

// 顧客相關類型定義
export interface CreateCustomerRequest {
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_birthdate?: string;
  gender?: string;
}

export interface CreateCustomerResponse {
  customer_profile_id: string;
}

export interface CustomerResponse {
  customer_profile_id: string;
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_birthdate?: string;
  gender?: string;
}

export interface CustomerListResponse {
  total: number;
  customers: CustomerResponse[];
}

// 員工相關類型定義
export interface CreateStaffRequest {
  business_id: string;
  staff_member_name: string;
  staff_member_email: string;
  staff_member_phone?: string;
  staff_member_hire_date?: string;
}

export interface CreateStaffResponse {
  staff_member_id: string;
}

export interface StaffResponse {
  staff_member_id: string;
  business_id: string;
  staff_member_name: string;
  staff_member_email: string;
  staff_member_phone?: string;
  staff_member_hire_date?: string;
  staff_member_termination_date?: string;
  staff_member_is_active: boolean;
}

export interface StaffListResponse {
  total: number;
  staff: StaffResponse[];
}

// 服務相關類型定義
export interface CreateServiceRequest {
  business_id: string;
  bookable_item_type_code: string;
  bookable_item_name: string;
  bookable_item_description?: string;
  bookable_item_duration: string;
  bookable_item_price?: number;
}

export interface CreateServiceResponse {
  bookable_item_id: string;
}

export interface ServiceResponse {
  bookable_item_id: string;
  business_id: string;
  bookable_item_type_code: string;
  bookable_item_name: string;
  bookable_item_description?: string;
  bookable_item_duration: string;
  bookable_item_price?: number;
}

export interface ServiceListResponse {
  total: number;
  services: ServiceResponse[];
}

// 類別相關類型定義
export interface CreateCategoryRequest {
  business_id: string;
  category_name: string;
  category_description?: string;
}

export interface CreateCategoryResponse {
  bookable_item_category_id: string;
}

export interface CategoryResponse {
  bookable_item_category_id: string;
  business_id: string;
  category_name: string;
  category_description?: string;
}

export interface CategoryListResponse {
  total: number;
  categories: CategoryResponse[];
}

// 會員等級相關類型定義
export interface CreateMembershipLevelRequest {
  business_id: string;
  membership_level_name: string;
  membership_level_description?: string;
  membership_level_benefits?: string;
}

export interface CreateMembershipLevelResponse {
  membership_level_id: string;
}

export interface MembershipLevelResponse {
  membership_level_id: string;
  business_id: string;
  membership_level_name: string;
  membership_level_description?: string;
  membership_level_benefits?: string;
}

export interface MembershipLevelListResponse {
  total: number;
  membership_levels: MembershipLevelResponse[];
}

// 廣告相關類型定義
export interface CreateAdvertisementRequest {
  business_id: string;
  advertisement_name: string;
  advertisement_description: string;
  advertisement_image_url: string;
  advertisement_landing_page_url: string;
  advertisement_start_date: string;
  advertisement_end_date: string;
  advertisement_budget: number;
  advertisement_target_audience: string;
}

export interface CreateAdvertisementResponse {
  advertisement_id: string;
}

export interface AdvertisementResponse {
  advertisement_id: string;
  business_id: string;
  advertisement_name: string;
  advertisement_description: string;
  advertisement_image_url: string;
  advertisement_landing_page_url: string;
  advertisement_start_date: string;
  advertisement_end_date: string;
  advertisement_budget: number;
  advertisement_target_audience: string;
  advertisement_status?: string;
}

export interface AdvertisementListResponse {
  total: number;
  advertisements: AdvertisementResponse[];
}

export interface ApproveAdvertisementRequest {
  approved: boolean;
  reason?: string;
}

// 使用者關係相關類型定義
export interface CreateUserRelationshipRequest {
  user_id_1: string;
  user_id_2: string;
  relationship_type: string;
}

export interface CreateUserRelationshipResponse {
  user_relationship_id: string;
}

export interface UserRelationshipResponse {
  user_relationship_id: string;
  user_id_1: string;
  user_id_2: string;
  relationship_type: string;
}

export interface UpdateUserRelationshipRequest {
  relationship_type: string;
}

export interface UserListResponse {
  total: number;
  users: {
    user_id: string;
    user_name: string;
    customer_phone?: string;
  }[];
}

export interface CreateBusinessRequest {
  business_name: string;
  business_timezone: string;
  business_contact_email?: string;
  business_contact_phone?: string;
  business_address?: string;
  business_location?: {
    latitude: number;
    longitude: number;
  };
  line_destination?: string;
}

export interface CreateBusinessResponse {
  business_id: string;
}

export interface BusinessResponse {
  business_id: string;
  business_name: string;
  business_timezone: string;
  business_contact_email?: string;
  business_contact_phone?: string;
  business_address?: string;
  business_location?: {
    latitude: number;
    longitude: number;
  };
  line_destination?: string;
}

// 新增更新商家的請求類型
export interface UpdateBusinessRequest {
  business_name?: string;
  business_timezone?: string;
  business_contact_email?: string | null;
  business_contact_phone?: string | null;
  business_address?: string | null;
  business_location?: {
    latitude: number;
    longitude: number;
  } | null;
  line_destination?: string | null;
}

// 在 src/types/api.ts 中添加以下类型定义

// 员工可用性相关类型定义
export interface CreateStaffAvailabilityRequest {
  staff_member_id: string;
  day_of_week: number;  // 0 (星期日) 到 6 (星期六)
  start_time: string;   // 格式: "HH:MM:SS" 
  end_time: string;     // 格式: "HH:MM:SS"
}

export interface CreateStaffAvailabilityResponse {
  staff_availability_id: string;
}

export interface StaffAvailabilityResponse {
  staff_availability_id: string;
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface StaffAvailabilityListResponse {
  total: number;
  availabilities: StaffAvailabilityResponse[];
}

// 在 src/types/api.ts 中添加以下类型定义

// 员工服务关系相关类型定义
export interface StaffServiceRequest {
  bookable_item_id: string;
}

export interface StaffServiceResponse {
  staff_member_id: string;
  bookable_item_id: string;
  bookable_item_name: string;
  bookable_item_type_code: string;
  bookable_item_duration: string;
}

export interface StaffServiceListResponse {
  total: number;
  services: StaffServiceResponse[];
}

// 在 src/types/api.ts 中添加以下类型定义

// 通知相关类型定义
export interface CreateNotificationRequest {
  notification_type: string; // email, sms, line
  notification_content: string;
  recipient_user_ids: string[]; // 接收者的用户ID数组
  booking_id?: string; // 可选，相关预约ID
}

export interface CreateNotificationResponse {
  notification_id: string;
}

export interface NotificationResponse {
  notification_id: string;
  notification_type: string;
  notification_content: string;
  created_at: string;
  updated_at: string;
  booking_id?: string;
}

export interface NotificationListResponse {
  total: number;
  notifications: NotificationResponse[];
}

// 在 src/types/api.ts 中添加以下类型定义

// 商业统计数据相关类型定义
export interface BusinessStatisticsResponse {
  date: string;
  total_revenue: number;
  total_bookings: number;
  new_customers: number;
}

export interface BusinessStatisticsRangeResponse {
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_bookings: number;
  new_customers: number;
  daily_statistics: BusinessStatisticsResponse[];
}

export interface PopularServicesResponse {
  bookable_item_id: string;
  bookable_item_name: string;
  booking_count: number;
  total_revenue: number;
}

export interface PopularStaffResponse {
  staff_member_id: string;
  staff_member_name: string;
  booking_count: number;
  total_revenue: number;
}

export interface BusinessInsightsResponse {
  popular_services: PopularServicesResponse[];
  popular_staff: PopularStaffResponse[];
  peak_booking_days: {
    day_of_week: number;
    booking_count: number;
  }[];
  peak_booking_hours: {
    hour: number;
    booking_count: number;
  }[];
}