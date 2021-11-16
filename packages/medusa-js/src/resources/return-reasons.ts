import BaseResource from './base';
import { StoreReturnReasonsListRes, StoreReturnReasonsRes } from '@medusajs/medusa';
import { AxiosPromise } from 'axios';

class ReturnReasonsResource extends BaseResource {
  /**
   * @description Retrieves a single Return Reason
   * @param id is required
   * @returns AxiosPromise<StoreReturnReasonsRes>
   */
  retrieve(id: string): AxiosPromise<StoreReturnReasonsRes> {
    const path = `/store/return-reasons/${id}`;
    return this.client.request('GET', path);
  }

  /**
   * Lists return reasons defined in Medusa Admin
   * @returns AxiosPromise<StoreReturnReasonsListRes>
   */
  list(): AxiosPromise<StoreReturnReasonsListRes> {
    const path = `/store/return-reasons`;
    return this.client.request('GET', path);
  }
}

export default ReturnReasonsResource;
