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
});
