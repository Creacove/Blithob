import { isDemoMode, isSupabaseConfigured, supabase } from "./supabase";

export interface PublicListingsClient {
  rpc: (
    functionName: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface PublicService {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  label: string;
  description: string;
  displayOrder: number;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface PublicJobSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  companyName: string;
  serviceSlug: string;
  serviceName: string;
  categorySlug?: string;
  categoryName?: string;
  employmentType: string;
  workMode: string;
  locationLabel: string;
  rateMinMinor?: number;
  rateMaxMinor?: number;
  currency: string;
  ratePeriod: string;
  applicationDeadline?: string;
  featuredOrder?: number;
  createdAt: string;
}

export interface PublicJob extends PublicJobSummary {
  description: string;
  deliverables: string[];
  references: Array<{
    label: string;
    kind: "link" | "file";
    url?: string;
    fileName?: string;
  }>;
}

export type JobApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "withdrawn"
  | "converted";

export interface PublicApplication {
  id: string;
  jobId: string;
  jobSlug: string;
  jobTitle: string;
  companyName: string;
  status: JobApplicationStatus;
  coverNote: string;
  portfolioUrl?: string;
  adminNote?: string;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
  professionalId?: string;
  applicantProfileId?: string;
  applicantName?: string;
  applicantEmail?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PublicJobFilters {
  query?: string;
  serviceSlug?: string;
  categorySlug?: string;
  workMode?: string;
  location?: string;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface PublicJobsResult {
  jobs: PublicJobSummary[];
  total: number;
}

export interface PublicListingsRepository {
  listServices(): Promise<PublicService[]>;
  listCategories(): Promise<PublicCategory[]>;
  listJobs(filters?: PublicJobFilters): Promise<PublicJobsResult>;
  getJob(slug: string): Promise<PublicJob | null>;
  listMyApplications(status?: JobApplicationStatus): Promise<PublicApplication[]>;
  listAdminApplications(options?: {
    jobId?: string;
    status?: JobApplicationStatus;
  }): Promise<PublicApplication[]>;
  completeProfessionalProfile(input: {
    displayName: string;
    phone: string;
    location: string;
  }): Promise<string>;
  submitApplication(input: {
    jobId: string;
    coverNote: string;
    portfolioUrl?: string;
  }): Promise<string>;
  withdrawApplication(applicationId: string): Promise<string>;
  reviewApplication(input: {
    applicationId: string;
    status: Extract<JobApplicationStatus, "under_review" | "shortlisted" | "rejected">;
    adminNote?: string;
  }): Promise<string>;
  convertApplication(input: {
    applicationId: string;
    agreedPay: number;
    deadline?: string;
    leadReviewerId?: string;
  }): Promise<string>;
}

function rowObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(rowObject) : [];
}

function text(row: Record<string, unknown>, key: string, fallback = "") {
  return typeof row[key] === "string" ? row[key] as string : fallback;
}

function optionalText(row: Record<string, unknown>, key: string) {
  const value = text(row, key).trim();
  return value ? value : undefined;
}

function numberValue(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function mapService(row: Record<string, unknown>): PublicService {
  return {
    id: text(row, "id"),
    slug: text(row, "slug"),
    name: text(row, "name"),
    shortName: text(row, "short_name"),
    label: text(row, "public_label") || text(row, "name"),
    description: text(row, "description"),
    displayOrder: numberValue(row, "display_order") ?? 0
  };
}

function mapCategory(row: Record<string, unknown>): PublicCategory {
  return {
    id: text(row, "id"),
    slug: text(row, "slug"),
    name: text(row, "name"),
    description: text(row, "description"),
    displayOrder: numberValue(row, "display_order") ?? 0
  };
}

function mapJob(row: Record<string, unknown>): PublicJobSummary {
  return {
    id: text(row, "id"),
    slug: text(row, "slug"),
    title: text(row, "title"),
    summary: text(row, "public_summary"),
    companyName: text(row, "public_company_name"),
    serviceSlug: text(row, "service_slug"),
    serviceName: text(row, "service_name"),
    categorySlug: optionalText(row, "category_slug"),
    categoryName: optionalText(row, "category_name"),
    employmentType: text(row, "employment_type"),
    workMode: text(row, "work_mode"),
    locationLabel: text(row, "location_label"),
    rateMinMinor: numberValue(row, "rate_min_minor"),
    rateMaxMinor: numberValue(row, "rate_max_minor"),
    currency: text(row, "rate_currency", "NGN"),
    ratePeriod: text(row, "rate_period"),
    applicationDeadline: optionalText(row, "application_deadline"),
    featuredOrder: numberValue(row, "featured_order"),
    createdAt: text(row, "created_at")
  };
}

function mapJobDetails(row: Record<string, unknown>): PublicJob {
  const rawReferences = Array.isArray(row.public_references) ? row.public_references : [];
  return {
    ...mapJob(row),
    description: text(row, "description"),
    deliverables: Array.isArray(row.deliverables)
      ? row.deliverables.filter((item): item is string => typeof item === "string")
      : [],
    references: rawReferences.map((item) => {
      const reference = rowObject(item);
      return {
        label: text(reference, "label"),
        kind: text(reference, "kind", "link") as "link" | "file",
        url: optionalText(reference, "url"),
        fileName: optionalText(reference, "fileName")
      };
    })
  };
}

function mapApplication(row: Record<string, unknown>): PublicApplication {
  return {
    id: text(row, "id"),
    jobId: text(row, "job_id"),
    jobSlug: text(row, "job_slug"),
    jobTitle: text(row, "job_title"),
    companyName: text(row, "company_name"),
    status: text(row, "status", "submitted") as JobApplicationStatus,
    coverNote: text(row, "cover_note"),
    portfolioUrl: optionalText(row, "portfolio_url"),
    adminNote: optionalText(row, "admin_note"),
    assignmentId: optionalText(row, "assignment_id"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
    professionalId: optionalText(row, "professional_id"),
    applicantProfileId: optionalText(row, "applicant_profile_id"),
    applicantName: optionalText(row, "applicant_name"),
    applicantEmail: optionalText(row, "applicant_email"),
    reviewedBy: optionalText(row, "reviewed_by"),
    reviewedAt: optionalText(row, "reviewed_at")
  };
}

async function resolve<T>(request: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const response = await request;
  if (response.error) throw new Error(response.error.message);
  return response.data as T;
}

function scalar(data: unknown) {
  if (Array.isArray(data)) return data[0] as string | undefined;
  return typeof data === "string" ? data : undefined;
}

export function createPublicListingsRepository(client: PublicListingsClient): PublicListingsRepository {
  return {
    async listServices() {
      const data = await resolve<unknown>(client.rpc("list_public_services"));
      return rows(data).map(mapService);
    },
    async listCategories() {
      const data = await resolve<unknown>(client.rpc("list_public_categories"));
      return rows(data).map(mapCategory);
    },
    async listJobs(filters = {}) {
      const data = await resolve<unknown>(client.rpc("list_public_jobs", {
        p_query: filters.query?.trim() || null,
        p_service_slug: filters.serviceSlug?.trim() || null,
        p_category_slug: filters.categorySlug?.trim() || null,
        p_work_mode: filters.workMode?.trim() || null,
        p_location: filters.location?.trim() || null,
        p_featured_only: filters.featuredOnly ?? false,
        p_limit: filters.limit ?? 12,
        p_offset: filters.offset ?? 0
      }));
      const mapped = rows(data).map(mapJob);
      return {
        jobs: mapped,
        total: numberValue(rows(data)[0] ?? {}, "total_count") ?? mapped.length
      };
    },
    async getJob(slug) {
      const data = await resolve<unknown>(client.rpc("get_public_job", { p_slug: slug }));
      const row = rows(data)[0];
      return row ? mapJobDetails(row) : null;
    },
    async listMyApplications(status) {
      const data = await resolve<unknown>(client.rpc("list_my_applications", { p_status: status ?? null }));
      return rows(data).map(mapApplication);
    },
    async listAdminApplications(options = {}) {
      const data = await resolve<unknown>(client.rpc("list_admin_applications", {
        p_job_id: options.jobId ?? null,
        p_status: options.status ?? null
      }));
      return rows(data).map(mapApplication);
    },
    async completeProfessionalProfile(input) {
      const data = await resolve<unknown>(client.rpc("complete_my_professional_profile", {
        p_display_name: input.displayName.trim(),
        p_phone: input.phone.trim(),
        p_location: input.location.trim()
      }));
      return scalar(data) ?? "";
    },
    async submitApplication(input) {
      const data = await resolve<unknown>(client.rpc("submit_job_application", {
        p_job_id: input.jobId,
        p_cover_note: input.coverNote.trim(),
        p_portfolio_url: input.portfolioUrl?.trim() || null
      }));
      return scalar(data) ?? "";
    },
    async withdrawApplication(applicationId) {
      const data = await resolve<unknown>(client.rpc("withdraw_job_application", {
        p_application_id: applicationId
      }));
      return scalar(data) ?? applicationId;
    },
    async reviewApplication(input) {
      const data = await resolve<unknown>(client.rpc("review_job_application", {
        p_application_id: input.applicationId,
        p_status: input.status,
        p_admin_note: input.adminNote?.trim() || null
      }));
      return scalar(data) ?? input.applicationId;
    },
    async convertApplication(input) {
      const data = await resolve<unknown>(client.rpc("convert_job_application_to_assignment", {
        p_application_id: input.applicationId,
        p_agreed_pay: input.agreedPay,
        p_deadline: input.deadline ?? null,
        p_lead_reviewer_id: input.leadReviewerId ?? null
      }));
      return scalar(data) ?? "";
    }
  };
}

export function createEmptyPublicListingsRepository(): PublicListingsRepository {
  return {
    async listServices() { return []; },
    async listCategories() { return []; },
    async listJobs() { return { jobs: [], total: 0 }; },
    async getJob() { return null; },
    async listMyApplications() { return []; },
    async listAdminApplications() { return []; },
    async completeProfessionalProfile() { throw new Error("Supabase is not configured."); },
    async submitApplication() { throw new Error("Supabase is not configured."); },
    async withdrawApplication() { throw new Error("Supabase is not configured."); },
    async reviewApplication() { throw new Error("Supabase is not configured."); },
    async convertApplication() { throw new Error("Supabase is not configured."); }
  };
}

const demoCategories: PublicCategory[] = [
  { id: "category-tech", slug: "tech", name: "Tech", description: "Product and engineering roles.", displayOrder: 1 },
  { id: "category-design", slug: "design", name: "Design", description: "Make useful things feel clear.", displayOrder: 2 },
  { id: "category-marketing", slug: "marketing", name: "Marketing", description: "Build demand and community.", displayOrder: 3 },
  { id: "category-operations", slug: "operations", name: "Operations", description: "Keep important work moving.", displayOrder: 4 },
  { id: "category-support", slug: "support", name: "Support", description: "Help people make progress.", displayOrder: 5 }
];
export const demoPublicCategories = demoCategories;

const demoJobs: PublicJobSummary[] = [
  {
    id: "frontend-developer",
    slug: "frontend-developer",
    title: "Frontend Developer",
    summary: "Build accessible, responsive product experiences used by growing teams around the world.",
    companyName: "Skyline Labs",
    serviceSlug: "web-development",
    serviceName: "Web development",
    categorySlug: "tech",
    categoryName: "Tech",
    employmentType: "Full-time",
    workMode: "Remote",
    locationLabel: "Lagos",
    rateMinMinor: 45000000,
    rateMaxMinor: 65000000,
    currency: "NGN",
    ratePeriod: "month",
    featuredOrder: 1,
    createdAt: "2026-09-02T10:00:00.000Z"
  },
  {
    id: "social-media-manager",
    slug: "social-media-manager",
    title: "Social Media Manager",
    summary: "Shape social campaigns, grow engaged communities, and turn insights into measurable momentum.",
    companyName: "Brightwave",
    serviceSlug: "social-media",
    serviceName: "Social media",
    categorySlug: "marketing",
    categoryName: "Marketing",
    employmentType: "Full-time",
    workMode: "Hybrid",
    locationLabel: "Lagos",
    rateMinMinor: 25000000,
    rateMaxMinor: 40000000,
    currency: "NGN",
    ratePeriod: "month",
    featuredOrder: 2,
    createdAt: "2026-09-01T10:00:00.000Z"
  },
  {
    id: "customer-support-rep",
    slug: "customer-support-rep",
    title: "Customer Support Rep",
    summary: "Help customers solve meaningful problems with clear communication and thoughtful support.",
    companyName: "Codeflow Systems",
    serviceSlug: "customer-support",
    serviceName: "Customer support",
    categorySlug: "support",
    categoryName: "Support",
    employmentType: "Full-time",
    workMode: "Remote",
    locationLabel: "Lagos",
    rateMinMinor: 28000000,
    rateMaxMinor: 42000000,
    currency: "NGN",
    ratePeriod: "month",
    featuredOrder: 3,
    createdAt: "2026-08-31T10:00:00.000Z"
  },
  {
    id: "operations-manager",
    slug: "operations-manager",
    title: "Operations Manager",
    summary: "Improve systems, coordinate teams, and keep important work moving with clarity.",
    companyName: "Flowstead",
    serviceSlug: "operations",
    serviceName: "Operations",
    categorySlug: "operations",
    categoryName: "Operations",
    employmentType: "Full-time",
    workMode: "Hybrid",
    locationLabel: "Lagos",
    rateMinMinor: 40000000,
    rateMaxMinor: 60000000,
    currency: "NGN",
    ratePeriod: "month",
    featuredOrder: 4,
    createdAt: "2026-08-30T10:00:00.000Z"
  },
  {
    id: "product-designer",
    slug: "product-designer",
    title: "Product Designer",
    summary: "Turn complex product ideas into simple, useful experiences for people everywhere.",
    companyName: "Northstar Studio",
    serviceSlug: "product-design",
    serviceName: "Product design",
    categorySlug: "design",
    categoryName: "Design",
    employmentType: "Full-time",
    workMode: "Remote",
    locationLabel: "Lagos",
    rateMinMinor: 40000000,
    rateMaxMinor: 65000000,
    currency: "NGN",
    ratePeriod: "month",
    featuredOrder: 5,
    createdAt: "2026-08-29T10:00:00.000Z"
  }
];
export const demoPublicJobs = demoJobs;

export function createDemoPublicListingsRepository(): PublicListingsRepository {
  const empty = createEmptyPublicListingsRepository();
  return {
    ...empty,
    async listServices() { return []; },
    async listCategories() { return demoCategories; },
    async listJobs(filters = {}) {
      const query = filters.query?.trim().toLowerCase();
      const jobs = demoJobs.filter((job) => {
        if (filters.featuredOnly && !job.featuredOrder) return false;
        if (filters.categorySlug && job.categorySlug !== filters.categorySlug) return false;
        if (filters.serviceSlug && job.serviceSlug !== filters.serviceSlug) return false;
        if (filters.workMode && job.workMode.toLowerCase() !== filters.workMode.toLowerCase()) return false;
        if (filters.location && !job.locationLabel.toLowerCase().includes(filters.location.toLowerCase())) return false;
        return !query || `${job.title} ${job.summary} ${job.companyName}`.toLowerCase().includes(query);
      });
      const offset = filters.offset ?? 0;
      return { jobs: jobs.slice(offset, offset + (filters.limit ?? 12)), total: jobs.length };
    },
    async getJob(slug) {
      const job = demoJobs.find((item) => item.slug === slug);
      return job ? {
        ...job,
        description: job.summary,
        deliverables: ["A clear, documented outcome"],
        references: []
      } : null;
    }
  };
}

export const publicListingsRepository: PublicListingsRepository =
  isSupabaseConfigured && supabase
    ? createPublicListingsRepository(supabase)
    : isDemoMode
      ? createDemoPublicListingsRepository()
      : createEmptyPublicListingsRepository();
