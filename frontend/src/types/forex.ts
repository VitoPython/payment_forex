/** Shapes returned by the FastAPI `/api/forex/catalogue` endpoint. */

export interface Datacenter {
  id: string;
  name: string;
  short: string;
}

export interface Period {
  key: string;
  months: number;
}

export interface PlanSpecs {
  cpu: string | null;
  ram: string | null;
  disk: string | null;
  port: string | null;
  traffic: string | null;
  bandwidth: string | null;
}

export interface Plan {
  id: string;
  key: string;
  tier: number;
  name: string;
  datacenter_id: string;
  specs: PlanSpecs;
  currency: string;
  /** period key -> cost, e.g. { "1": 6.48, "12": 77.76 } */
  prices: Record<string, number>;
  order_url: string;
}

export interface ForexCatalogue {
  datacenters: Datacenter[];
  periods: Period[];
  plans: Plan[];
}
