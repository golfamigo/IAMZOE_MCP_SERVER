"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatedToolDefinitions = void 0;
const advertisementTools_1 = require("./advertisementTools");
const advertisementTools_2 = require("./advertisementTools");
const advertisementTools_3 = require("./advertisementTools");
const bookingTools_1 = require("./bookingTools");
const bookingTools_2 = require("./bookingTools");
const bookingTools_3 = require("./bookingTools");
const businessTools_1 = require("./businessTools");
const businessTools_2 = require("./businessTools");
const categoryTools_1 = require("./categoryTools");
const customerTools_1 = require("./customerTools");
const customerTools_2 = require("./customerTools");
const listTools_1 = require("./listTools");
const membershipLevelTools_1 = require("./membershipLevelTools");
const membershipLevelTools_2 = require("./membershipLevelTools");
const membershipLevelTools_3 = require("./membershipLevelTools");
const notificationTools_1 = require("./notificationTools");
const serviceTools_1 = require("./serviceTools");
const serviceTools_2 = require("./serviceTools");
const serviceTools_3 = require("./serviceTools");
const serviceTools_4 = require("./serviceTools");
const staffTools_1 = require("./staffTools");
const staffTools_2 = require("./staffTools");
const staffTools_3 = require("./staffTools");
const staffTools_4 = require("./staffTools");
const subscriptionTools_1 = require("./subscriptionTools");
const userRelationshipTools_1 = require("./userRelationshipTools");
const userRelationshipTools_2 = require("./userRelationshipTools");
const userTools_1 = require("./userTools");
const userTools_2 = require("./userTools");
// 工具定義列表
exports.generatedToolDefinitions = [
    // advertisementTools 工具
    advertisementTools_1.createAdvertisement,
    // advertisementTools 工具
    advertisementTools_2.approveAdvertisement,
    // advertisementTools 工具
    advertisementTools_3.updateAdvertisementStatus,
    // bookingTools 工具
    bookingTools_1.getBookings,
    // bookingTools 工具
    bookingTools_2.createBooking,
    // bookingTools 工具
    bookingTools_3.cancelBooking,
    // businessTools 工具
    businessTools_1.getBusinessHours,
    // businessTools 工具
    businessTools_2.createBusiness,
    // categoryTools 工具
    categoryTools_1.createCategory,
    // customerTools 工具
    customerTools_1.createCustomer,
    // customerTools 工具
    customerTools_2.getCustomer,
    // listTools 工具
    listTools_1.listTools,
    // membershipLevelTools 工具
    membershipLevelTools_1.createMembershipLevel,
    // membershipLevelTools 工具
    membershipLevelTools_2.getMembershipLevel,
    // membershipLevelTools 工具
    membershipLevelTools_3.assignMembershipLevel,
    // notificationTools 工具
    notificationTools_1.createNotification,
    // serviceTools 工具
    serviceTools_1.getServicesByBusinessId,
    // serviceTools 工具
    serviceTools_2.createService,
    // serviceTools 工具
    serviceTools_3.getService,
    // serviceTools 工具
    serviceTools_4.getAvailableSlots,
    // staffTools 工具
    staffTools_1.createStaff,
    // staffTools 工具
    staffTools_2.getStaff,
    // staffTools 工具
    staffTools_3.addStaffAvailability,
    // staffTools 工具
    staffTools_4.assignServiceToStaff,
    // subscriptionTools 工具
    subscriptionTools_1.createSubscription,
    // userRelationshipTools 工具
    userRelationshipTools_1.createUserRelationship,
    // userRelationshipTools 工具
    userRelationshipTools_2.getUserRelationship,
    // userTools 工具
    userTools_1.createUser,
    // userTools 工具
    userTools_2.getSuitableUsersForAdvertisement,
];
