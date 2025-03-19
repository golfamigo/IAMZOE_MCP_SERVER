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

// 廣告相關工具
export const advertisementTools = {
  // 創建廣告
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
    
    await neo4jClient.runQuery(
      `MATCH (a:Advertisement {advertisement_id: $advertisement_id})
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
  }
};
