import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

// 接口定義
export interface Advertisement {
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
  advertisement_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAdvertisementParams {
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

export interface CreateAdvertisementResult {
  advertisement_id: string;
}

export interface ApproveAdvertisementParams {
  advertisement_id: string;
  approved: boolean;
  reason?: string;
}

export interface UpdateAdvertisementStatusParams {
  advertisement_id: string;
  status: 'active' | 'completed';
}

// 廣告相關工具
export const advertisementTools = {
  // 建立廣告
  createAdvertisement: async (params: CreateAdvertisementParams): Promise<CreateAdvertisementResult> => {
    const { 
      business_id, 
      advertisement_name, 
      advertisement_description,
      advertisement_image_url,
      advertisement_landing_page_url,
      advertisement_start_date,
      advertisement_end_date,
      advertisement_budget,
      advertisement_target_audience
    } = params;
    
    // 驗證資料
    if (advertisement_name.length > 255) {
      throw new Error('advertisement_name 超過最大長度 (255)');
    }
    
    if (advertisement_description.length > 1000) {
      throw new Error('advertisement_description 超過最大長度 (1000)');
    }
    
    const advertisement_id = uuidv4();
    
    await neo4jClient.runQuery(
      `CREATE (a:Advertisement {
        advertisement_id: $advertisement_id,
        business_id: $business_id,
        advertisement_name: $advertisement_name,
        advertisement_description: $advertisement_description,
        advertisement_image_url: $advertisement_image_url,
        advertisement_landing_page_url: $advertisement_landing_page_url,
        advertisement_start_date: date($advertisement_start_date),
        advertisement_end_date: date($advertisement_end_date),
        advertisement_budget: $advertisement_budget,
        advertisement_target_audience: $advertisement_target_audience,
        advertisement_status: 'pending',
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN a`,
      { 
        advertisement_id, 
        business_id, 
        advertisement_name, 
        advertisement_description,
        advertisement_image_url,
        advertisement_landing_page_url,
        advertisement_start_date,
        advertisement_end_date,
        advertisement_budget,
        advertisement_target_audience
      }
    );
    
    return { advertisement_id };
  },
  
  // 審核廣告
  approveAdvertisement: async (params: ApproveAdvertisementParams): Promise<void> => {
    const { advertisement_id, approved, reason } = params;
    
    // 審核廣告，將狀態更新為 approved 或 rejected
    await neo4jClient.runQuery(
      `MATCH (a:Advertisement {advertisement_id: $advertisement_id})
       WHERE a.advertisement_status = 'pending'
       SET a.advertisement_status = $status,
           a.updated_at = datetime()
       ${reason ? ', a.rejection_reason = $reason' : ''}
       RETURN a`,
      { 
        advertisement_id, 
        status: approved ? 'approved' : 'rejected',
        reason
      }
    );
  },
  
  // 更新廣告狀態
  updateAdvertisementStatus: async (params: UpdateAdvertisementStatusParams): Promise<void> => {
    const { advertisement_id, status } = params;
    
    // 確保只有已批准的廣告才能更新為 active 或 completed
    const validTransitions: Record<string, string[]> = {
      'approved': ['active'],
      'active': ['completed']
    };
    
    const result = await neo4jClient.runQuery(
      `MATCH (a:Advertisement {advertisement_id: $advertisement_id})
       RETURN a.advertisement_status as current_status`,
      { advertisement_id }
    );
    
    if (result.records.length === 0) {
      throw new Error('找不到廣告');
    }
    
    const currentStatus = result.records[0].get('current_status') as string;
    const allowedStatusChanges = validTransitions[currentStatus] || [];
    
    if (!allowedStatusChanges.includes(status)) {
      throw new Error(`不允許將廣告狀態從 ${currentStatus} 更新為 ${status}`);
    }
    
    await neo4jClient.runQuery(
      `MATCH (a:Advertisement {advertisement_id: $advertisement_id})
       SET a.advertisement_status = $status,
           a.updated_at = datetime()
       RETURN a`,
      { advertisement_id, status }
    );
  }
};
