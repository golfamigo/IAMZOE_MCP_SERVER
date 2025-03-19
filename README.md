# Neo4j预约系统后端服务

## 项目介绍

本项目是一个基于Neo4j图数据库的预约系统后端服务，支持预约管理、顾客管理、员工管理、服务管理、报表分析等功能，为MCP Server提供了一套完整的API接口。

## 功能模块

项目主要包含以下功能模块：

1. **预约管理**：创建、查询、更新和取消预约
2. **顾客管理**：顾客资料的管理和查询
3. **员工管理**：员工资料的管理和查询
4. **服务管理**：可预约服务或项目的管理
5. **类别管理**：服务类别的管理
6. **会员等级管理**：会员等级和权益管理
7. **员工可用性管理**：管理员工的工作时间和可用性
8. **员工服务能力管理**：管理员工可提供的服务
9. **通知系统**：向客户发送预约通知
10. **商业统计**：业务数据统计和分析
11. **广告管理**：广告创建和审核
12. **用户关系管理**：用户之间的关系维护

## 技术栈

- **后端框架**：Node.js + Express.js
- **数据库**：Neo4j图数据库
- **API验证**：AJV (JSON Schema Validator)
- **MCP集成**：@modelcontextprotocol/sdk

## 安装与运行

1. 确保已安装Node.js和Neo4j数据库
2. 克隆项目到本地
3. 安装依赖：`npm install`
4. 复制`.env.example`文件为`.env`，并配置相关环境变量
5. 启动服务：`npm start`

## 环境变量配置

创建`.env`文件，包含以下配置：

```
PORT=3000
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
API_KEY=your_api_key
```

## 开发说明

### 数据库模型

项目使用Neo4j图数据库，遵循"Gemini完善的资料模型.md"中定义的节点和关系模型。主要节点类型包括:

- :Business - 商家节点
- :User - 用户节点
- :Customer - 顾客节点
- :Staff - 员工节点
- :BookableItem - 可预约项目节点
- :Booking - 预约节点
- :Category - 类别节点
- :MembershipLevel - 会员等级节点
- :StaffAvailability - 员工可用性节点
- :Notification - 通知节点

详细的数据模型请参考"Gemini完善的资料模型.md"文档。

### API文档

API接口遵循RESTful设计规范，详细的API规范请参考"Gemini的API规范文件.md"文档。

## 新增功能说明

### 员工可用性管理

新增了员工可用性（StaffAvailability）相关功能，可以设置员工的工作时间，并用于预约时间的选择。

**相关API**:
- POST /staff-availability - 创建员工可用性
- GET /staff/:staff_member_id/availability - 获取员工可用性
- PUT /staff-availability/:staff_availability_id - 更新员工可用性
- DELETE /staff-availability/:staff_availability_id - 删除员工可用性

### 员工服务能力管理

新增了员工服务能力（CAN_PROVIDE关系）相关功能，用于管理员工可提供的服务。

**相关API**:
- POST /staff/:staff_member_id/services - 添加员工可提供的服务
- GET /staff/:staff_member_id/services - 获取员工可提供的服务列表
- DELETE /staff/:staff_member_id/services/:bookable_item_id - 删除员工可提供的服务
- GET /services/:bookable_item_id/staff - 查找能提供指定服务的员工

### 通知系统

完善了通知系统（Notification）相关功能，用于向客户发送预约通知。

**相关API**:
- POST /notifications - 创建通知
- GET /users/:user_id/notifications - 获取用户的通知列表
- GET /bookings/:booking_id/notifications - 获取预约的通知列表
- DELETE /notifications/:notification_id - 删除通知

### 商业统计数据

新增了商业统计数据相关功能，用于统计和分析业务数据。

**相关API**:
- GET /businesses/:business_id/statistics - 获取日期范围内的商业统计数据
- GET /businesses/:business_id/insights - 获取商业洞察数据

### 数据库索引和约束

添加了数据库索引和约束的设置功能，确保数据完整性和查询性能。

## 联系方式

如有问题，请联系项目负责人。