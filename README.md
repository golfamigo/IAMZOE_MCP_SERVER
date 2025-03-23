# Neo4j预约系统 MCP 服务器

> **注意**: 这是纯 MCP 服务器分支，已移除所有 API 相关代码。

## 项目介绍

本项目是一个基于Neo4j图数据库的预约系统 MCP 服务器，支持预约管理、顾客管理、员工管理、服务管理、报表分析等功能，为 Claude 等大型语言模型提供了一套完整的 MCP 工具。

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

- **后端框架**：Node.js
- **数据库**：Neo4j图数据库
- **MCP集成**：@modelcontextprotocol/sdk

## 安装与运行

1. 确保已安装Node.js和Neo4j数据库
2. 克隆项目到本地
3. 安装依赖：`npm install`
4. 复制`.env.example`文件为`.env`，并配置相关环境变量
5. 执行初始化：`npm run initialize`
6. 启动服务：`npm start`

## 开发工作流程

本项目已简化开发流程，提供以下命令：

| 命令 | 描述 |
|------|------|
| `npm run initialize` | 执行一次性初始化任务，包括数据库索引创建、工具定义生成和文档生成 |
| `npm run build` | 编译TypeScript代码 |
| `npm start` | 以生产模式启动服务器 |
| `npm run dev` | 以开发模式启动服务器（自动编译TypeScript） |
| `npm test` | 运行测试用例 |

### 重要说明

- `initialize` 命令仅需在首次设置或需要重新生成资源时执行
- 日常开发使用 `npm run dev`
- 部署前构建使用 `npm run build`
- 生产环境启动使用 `npm start`

## 环境变量配置

创建`.env`文件，包含以下配置：

```
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
PORT=3003

# 数据库初始化设置
# 设置为 true 表示跳过数据库索引和约束的初始化
# 首次部署时设置为 false，之后可改为 true 以提高启动速度
SKIP_DB_INIT=true
```

## 开发说明

### 项目结构

```
├── dist/                 # 编译后的JavaScript文件
├── docs/                 # 文档目录
├── src/
│   ├── scripts/          # 脚本文件
│   │   └── initialize/   # 初始化脚本
│   ├── tools/            # MCP工具实现
│   ├── types/            # TypeScript类型定义
│   ├── utils/            # 工具函数
│   ├── db.ts             # 数据库连接模块
│   └── index.ts          # 主入口文件
├── .env                  # 环境变量配置
├── package.json          # 项目依赖和脚本
└── README.md             # 项目说明文档
```

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
- :Advertisement - 广告节点

详细的数据模型请参考"Gemini完善的资料模型.md"文档。

### 数据库索引和约束

数据库索引和约束已在初始化脚本中设置，确保数据完整性和查询性能。执行`npm run initialize`时会自动创建所需的索引和约束。

### MCP工具说明

本项目为Claude等LLM提供MCP工具，工具定义存储在`src/tools`目录下。执行`npm run initialize`会自动生成工具定义和文档。

工具使用文档位于`docs/Tools-Usage-Guide.md`，详细说明了每个工具的功能、参数和示例。

## 联系方式

如有问题，请联系项目负责人。