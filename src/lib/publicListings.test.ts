import { describe, expect, it, vi } from "vitest";
import {
  createPublicListingsRepository,
  type PublicListingsClient
} from "./publicListings";

function fakeClient(response: { data: unknown; error: { message: string } | null }) {
  return {
    rpc: vi.fn().mockResolvedValue(response)
  } as unknown as PublicListingsClient & { rpc: ReturnType<typeof vi.fn> };
}

describe("public listings repository", () => {
  it("calls the safe public jobs RPC and maps database rows to UI fields", async () => {
    const client = fakeClient({
      data: [
        {
          id: "job-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          public_summary: "Build a clearer product surface.",
          public_company_name: "A client team",
          service_slug: "web-development",
          service_name: "Web development",
          category_slug: "tech",
          category_name: "Tech",
          employment_type: "Contract",
          work_mode: "Remote",
          location_label: "Lagos",
          rate_min_minor: 45000000,
          rate_max_minor: 65000000,
          rate_currency: "NGN",
          rate_period: "project",
          application_deadline: null,
          featured_order: 1,
          created_at: "2026-09-02T10:00:00.000Z",
          total_count: 1
        }
      ],
      error: null
    });

    const repository = createPublicListingsRepository(client);
    const result = await repository.listJobs({ featuredOnly: true, limit: 5 });

    expect(client.rpc).toHaveBeenCalledWith("list_public_jobs", {
      p_query: null,
      p_service_slug: null,
      p_category_slug: null,
      p_work_mode: null,
      p_location: null,
      p_country_code: null,
      p_employment_type: null,
      p_min_rate_minor: null,
      p_max_rate_minor: null,
      p_featured_only: true,
      p_limit: 5,
      p_offset: 0
    });
    expect(result).toEqual({
      jobs: [
        expect.objectContaining({
          id: "job-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          companyName: "A client team",
          rateMinMinor: 45000000,
          rateMaxMinor: 65000000,
          currency: "NGN"
        })
      ],
      total: 1
    });
  });

  it("does not hide RPC failures behind an empty state", async () => {
    const client = fakeClient({ data: null, error: { message: "network down" } });
    const repository = createPublicListingsRepository(client);

    await expect(repository.listCategories()).rejects.toThrow("network down");
  });

  it("submits applications with the completed CV document reference", async () => {
    const client = fakeClient({ data: ["application-1"], error: null });
    const repository = createPublicListingsRepository(client);

    await repository.submitApplication({
      jobId: "job-1",
      coverNote: "I have shipped similar products and can start next month.",
      cvDocumentId: "cv-1"
    });

    expect(client.rpc).toHaveBeenCalledWith("submit_job_application_with_cv", {
      p_job_id: "job-1",
      p_cover_note: "I have shipped similar products and can start next month.",
      p_portfolio_url: null,
      p_cv_document_id: "cv-1"
    });
  });

  it("maps Service readiness fields from the Admin application read model", async () => {
    const client = fakeClient({
      data: [{
        id: "application-1",
        job_id: "job-1",
        job_slug: "frontend-developer",
        job_title: "Frontend Developer",
        company_name: "A client team",
        service_id: "service-web",
        service_name: "Web development",
        professional_id: "professional-1",
        status: "shortlisted",
        cover_note: "A thoughtful application note.",
        created_at: "2026-09-02T10:00:00.000Z",
        updated_at: "2026-09-02T10:00:00.000Z",
        readiness_enrolment_id: "enrolment-1",
        readiness_status: "in_progress",
        readiness_completed_count: 1,
        readiness_requirement_count: 3,
        ready_for_assignment: false,
        total_count: 1
      }],
      error: null
    });
    const repository = createPublicListingsRepository(client);

    const [result] = await repository.listAdminApplications();

    expect(result).toEqual(expect.objectContaining({
      serviceId: "service-web",
      serviceName: "Web development",
      readinessEnrolmentId: "enrolment-1",
      readinessStatus: "in_progress",
      readinessCompletedCount: 1,
      readinessRequirementCount: 3,
      readyForAssignment: false
    }));
  });

  it("maps Professional readiness fields from the personal application read model", async () => {
    const client = fakeClient({
      data: [{
        id: "application-1",
        job_id: "job-1",
        job_slug: "frontend-developer",
        job_title: "Frontend Developer",
        company_name: "A client team",
        status: "shortlisted",
        cover_note: "A thoughtful application note.",
        created_at: "2026-09-02T10:00:00.000Z",
        updated_at: "2026-09-02T10:00:00.000Z",
        readiness_enrolment_id: "enrolment-1",
        readiness_status: "in_progress",
        readiness_completed_count: 1,
        readiness_requirement_count: 3,
        ready_for_assignment: false
      }],
      error: null
    });
    const repository = createPublicListingsRepository(client);

    const [result] = await repository.listMyApplications();

    expect(client.rpc).toHaveBeenCalledWith("list_my_applications", { p_status: null });
    expect(result).toEqual(expect.objectContaining({
      readinessEnrolmentId: "enrolment-1",
      readinessStatus: "in_progress",
      readinessCompletedCount: 1,
      readinessRequirementCount: 3,
      readyForAssignment: false
    }));
  });

  it("maps per-job applicant metrics for the Admin job directory", async () => {
    const client = fakeClient({
      data: [{ job_id: "job-1", applicant_count: "2", hired_count: 1, needs_action_count: 1 }],
      error: null
    });
    const repository = createPublicListingsRepository(client);

    await expect(repository.listAdminJobMetrics?.()).resolves.toEqual([{
      jobId: "job-1",
      applicantCount: 2,
      hiredCount: 1,
      needsActionCount: 1
    }]);
    expect(client.rpc).toHaveBeenCalledWith("list_admin_job_metrics");
  });

  it("shortlists through the atomic readiness handoff RPC", async () => {
    const client = fakeClient({ data: [{ application_id: "application-1" }], error: null });
    const repository = createPublicListingsRepository(client);

    await expect(repository.shortlistApplication({
      applicationId: "application-1",
      adminNote: "Strong fit for the role."
    })).resolves.toBe("application-1");

    expect(client.rpc).toHaveBeenCalledWith("shortlist_job_application", {
      p_application_id: "application-1",
      p_admin_note: "Strong fit for the role."
    });
  });

  it("passes bounded discovery filters to the safe jobs RPC", async () => {
    const client = fakeClient({ data: [], error: null });
    const repository = createPublicListingsRepository(client);

    await repository.listJobs({
      countryCode: "NG",
      location: "Lagos",
      categorySlug: "design",
      minRateMinor: 100000,
      maxRateMinor: 500000,
      workMode: "Remote",
      employmentType: "Full-time",
      limit: 12,
      offset: 0
    });

    expect(client.rpc).toHaveBeenCalledWith("list_public_jobs", expect.objectContaining({
      p_country_code: "NG",
      p_location: "Lagos",
      p_category_slug: "design",
      p_min_rate_minor: 100000,
      p_max_rate_minor: 500000,
      p_work_mode: "Remote",
      p_employment_type: "Full-time"
    }));
  });
});
