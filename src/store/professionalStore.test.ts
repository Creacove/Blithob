import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyState } from "../domain/migrate";
import { useProfessionalStore } from "./professionalStore";

describe("professional store", () => {
  beforeEach(() => {
    localStorage.clear();
    useProfessionalStore.getState().resetDemo();
    useProfessionalStore.getState().signOut();
  });

  it("signs the Lead persona into the Professional workspace", () => {
    useProfessionalStore.getState().signIn("lead");

    expect(useProfessionalStore.getState().currentUser()).toMatchObject({
      id: "user-nneka",
      accountRole: "professional"
    });
    expect(
      useProfessionalStore.getState().currentProfessional()?.isLead
    ).toBe(true);
  });

  it("promotes a Professional without changing account role", () => {
    useProfessionalStore
      .getState()
      .setLeadCapability("professional-amara", true);

    expect(
      useProfessionalStore
        .getState()
        .professionals.find((item) => item.id === "professional-amara")?.isLead
    ).toBe(true);
    expect(
      useProfessionalStore
        .getState()
        .users.find((item) => item.id === "user-amara")?.accountRole
    ).toBe("professional");
  });

  it("creates two independent Assignments from one Admin action", () => {
    useProfessionalStore.getState().addAssignments("job-open-social", [
      {
        professionalId: "professional-amara",
        agreedPay: 145000,
        deadline: "2026-06-24",
        leadReviewerId: "professional-nneka"
      },
      {
        professionalId: "professional-david",
        agreedPay: 120000,
        deadline: "2026-06-25"
      }
    ]);

    expect(
      useProfessionalStore
        .getState()
        .assignments.filter((item) => item.jobId === "job-open-social")
    ).toHaveLength(2);
  });

  it("routes pending Lead work to Admin when Lead capability is removed", () => {
    useProfessionalStore
      .getState()
      .setLeadCapability("professional-nneka", false);

    expect(
      useProfessionalStore
        .getState()
        .assignments.find((item) => item.id === "assignment-waiting-lead")
    ).toMatchObject({
      leadReviewerId: undefined,
      status: "waiting_for_admin"
    });
    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.find(
          (item) => item.id === "enrolment-nneka-data"
        )
    ).toMatchObject({
      leadId: undefined,
      status: "waiting_for_admin"
    });
  });

  it("resolves demo personas from migrated legacy user IDs", () => {
    const migrated = migrateLegacyState({
      users: [
        {
          id: "user-trainer",
          name: "Legacy Lead",
          email: "lead@example.com",
          role: "trainer",
          workerId: "worker-lead"
        }
      ],
      workers: [
        {
          id: "worker-lead",
          userId: "user-trainer",
          name: "Legacy Lead",
          email: "lead@example.com",
          phone: "0800",
          location: "Lagos",
          status: "active",
          approvedServiceIds: [],
          training: [],
          completedCount: 1,
          notes: "",
          joinedAt: "2025-01-01",
          isLead: true
        }
      ]
    });
    useProfessionalStore.setState({ ...migrated, session: null });

    useProfessionalStore.getState().signIn("lead");

    expect(useProfessionalStore.getState().currentUser()?.id).toBe(
      "user-trainer"
    );
    expect(
      useProfessionalStore.getState().currentProfessional()?.isLead
    ).toBe(true);
  });

  it("creates a Professional account without forcing an enrolment", () => {
    const professionalId = useProfessionalStore
      .getState()
      .createProfessional({
        name: "Kemi Adeyemi",
        email: "kemi@example.com",
        phone: "+234 800 000 0000",
        location: "Ibadan"
      });

    expect(
      useProfessionalStore
        .getState()
        .professionals.find((item) => item.id === professionalId)
    ).toMatchObject({ name: "Kemi Adeyemi", isLead: false });
    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.some(
          (item) => item.professionalId === professionalId
        )
    ).toBe(false);
  });

  it("creates one Service enrolment with an optional Lead", () => {
    const enrolmentId = useProfessionalStore
      .getState()
      .createServiceEnrolment(
        "professional-zainab",
        "service-va",
        "professional-nneka"
      );

    expect(
      useProfessionalStore
        .getState()
        .serviceEnrolments.find((item) => item.id === enrolmentId)
    ).toMatchObject({
      professionalId: "professional-zainab",
      serviceId: "service-va",
      leadId: "professional-nneka",
      status: "not_started"
    });
  });

  it("rejects a duplicate active Service enrolment", () => {
    expect(
      useProfessionalStore
        .getState()
        .createServiceEnrolment(
          "professional-amara",
          "service-social",
          "professional-nneka"
        )
    ).toBeUndefined();
  });

  it("creates one Service with an ordered readiness checklist", () => {
    const id = useProfessionalStore.getState().createService({
      name: "Research support",
      shortName: "Research",
      description: "Structured desk research and summaries.",
      requirements: [
        {
          title: "Review research standards",
          description: "Understand citation and source requirements.",
          requiresEvidence: false
        },
        {
          title: "Submit a sample brief",
          description: "Produce one sourced sample report.",
          requiresEvidence: true
        }
      ]
    });
    const service = useProfessionalStore
      .getState()
      .services.find((item) => item.id === id);

    expect(service?.requirements.map((item) => item.order)).toEqual([0, 1]);
  });

  it("keeps public Service metadata in the local contract", () => {
    const id = useProfessionalStore.getState().createService({
      name: "Research support",
      shortName: "Research",
      description: "Structured desk research and summaries.",
      slug: "research-support",
      publicLabel: "Research support",
      publicVisible: true,
      displayOrder: 6,
      requirements: []
    });

    expect(
      useProfessionalStore.getState().services.find((item) => item.id === id)
    ).toMatchObject({
      slug: "research-support",
      publicLabel: "Research support",
      publicVisible: true,
      displayOrder: 6
    });
  });

  it("prevents inactive Services from receiving enrolments or Jobs", () => {
    useProfessionalStore.setState((state) => ({
      services: state.services.map((service) =>
        service.id === "service-va" ? { ...service, active: false } : service
      )
    }));

    expect(
      useProfessionalStore
        .getState()
        .createServiceEnrolment("professional-zainab", "service-va")
    ).toBeUndefined();
    expect(
      useProfessionalStore.getState().createJob({
        title: "Inactive service draft",
        serviceId: "service-va",
        clientContext: "",
        objective: "",
        description: "",
        steps: [],
        deliverables: [],
        acceptanceCriteria: [],
        references: [],
        submissionEvidenceRequired: false,
        deadline: ""
      })
    ).toBeUndefined();
  });

  it("keeps enrolment progress aligned when Service requirements change", () => {
    const state = useProfessionalStore.getState();
    const enrolment = state.serviceEnrolments.find(
      (item) => item.serviceId === "service-social"
    );
    const service = state.services.find(
      (item) => item.id === "service-social"
    );
    expect(enrolment).toBeDefined();
    expect(service).toBeDefined();

    const completedRequirement = enrolment?.requirements.find(
      (item) => item.completed
    );
    expect(completedRequirement).toBeDefined();

    state.replaceServiceRequirements("service-social", [
      {
        id: service?.requirements[1].id,
        title: service?.requirements[1].title ?? "",
        description: service?.requirements[1].description ?? "",
        requiresEvidence: service?.requirements[1].requiresEvidence ?? false
      },
      {
        id: completedRequirement?.requirementId,
        title:
          service?.requirements.find(
            (item) => item.id === completedRequirement?.requirementId
          )?.title ?? "",
        description:
          service?.requirements.find(
            (item) => item.id === completedRequirement?.requirementId
          )?.description ?? "",
        requiresEvidence: true
      },
      {
        title: "Complete a final quality check",
        description: "Review the work against the delivery checklist.",
        requiresEvidence: false
      }
    ]);

    const updatedEnrolment = useProfessionalStore
      .getState()
      .serviceEnrolments.find((item) => item.id === enrolment?.id);
    expect(updatedEnrolment?.requirements).toHaveLength(3);
    expect(updatedEnrolment?.requirements[1]).toEqual(
      expect.objectContaining({
        requirementId: completedRequirement?.requirementId,
        completed: true
      })
    );
    expect(updatedEnrolment?.requirements[2].completed).toBe(false);
  });

  it("allows an incomplete Job to be saved as a draft", async () => {
    const jobId = await useProfessionalStore.getState().createJob({
      title: "Client research",
      serviceId: "service-content",
      clientContext: "",
      objective: "",
      description: "",
      steps: [],
      deliverables: [],
      acceptanceCriteria: [],
      references: [],
      submissionEvidenceRequired: false,
      deadline: ""
    });

    expect(
      useProfessionalStore
        .getState()
        .jobs.find((item) => item.id === jobId)
    ).toMatchObject({
      title: "Client research",
      publicationState: "draft"
    });
  });

  it("publishes only a complete Job brief", async () => {
    const jobId = await useProfessionalStore.getState().createJob({
      title: "Client research",
      serviceId: "service-content",
      clientContext: "A client needs a sourced market summary.",
      objective: "Produce a concise decision-ready report.",
      description: "Research the market and summarize the strongest findings.",
      steps: [""],
      deliverables: ["Research report"],
      acceptanceCriteria: ["Every claim includes a source."],
      references: [
        {
          id: "reference-brief",
          label: "Client brief",
          kind: "link"
        }
      ],
      submissionEvidenceRequired: true,
      deadline: "2026-07-01T17:00:00.000Z"
    });

    expect(jobId).toBeDefined();
    expect(
      useProfessionalStore.getState().publishJob(jobId ?? "")
    ).toBe(false);

    useProfessionalStore.getState().updateJob(jobId ?? "", {
      steps: ["Review the brief and source requirements."],
      references: [
        {
          id: "reference-brief",
          label: "Client brief",
          kind: "link",
          url: "https://example.com/client-brief"
        }
      ]
    });

    expect(
      useProfessionalStore.getState().publishJob(jobId ?? "")
    ).toBe(true);
  });

  it("rejects new Assignments after a Job is archived", () => {
    useProfessionalStore.getState().archiveJob("job-open-social");
    const before = useProfessionalStore.getState().assignments.length;

    useProfessionalStore.getState().addAssignments("job-open-social", [
      {
        professionalId: "professional-amara",
        agreedPay: 100000,
        deadline: "2026-07-01T17:00:00.000Z"
      }
    ]);

    expect(useProfessionalStore.getState().assignments).toHaveLength(before);
  });

  it("rejects Assignments until a Job is published", async () => {
    const jobId = await useProfessionalStore.getState().createJob({
      title: "Draft research brief",
      serviceId: "service-content",
      clientContext: "",
      objective: "",
      description: "",
      steps: [],
      deliverables: [],
      acceptanceCriteria: [],
      references: [],
      submissionEvidenceRequired: false,
      deadline: ""
    });
    const before = useProfessionalStore.getState().assignments.length;

    useProfessionalStore.getState().addAssignments(jobId ?? "", [
      {
        professionalId: "professional-nneka",
        agreedPay: 100000,
        deadline: "2026-07-01T17:00:00.000Z"
      }
    ]);

    expect(useProfessionalStore.getState().assignments).toHaveLength(before);
  });

  it("routes an Assignment directly to Admin when the assignee is the Lead", () => {
    useProfessionalStore.getState().addAssignments("job-open-social", [
      {
        professionalId: "professional-amara",
        agreedPay: 100000,
        deadline: "2026-07-01T17:00:00.000Z",
        leadReviewerId: "professional-amara"
      }
    ]);

    expect(
      useProfessionalStore
        .getState()
        .assignments.find(
          (item) =>
            item.jobId === "job-open-social" &&
            item.professionalId === "professional-amara"
        )
    ).toMatchObject({ leadReviewerId: undefined });
  });

  it("rejects Assignments without positive pay and a deadline", () => {
    const before = useProfessionalStore.getState().assignments.length;

    useProfessionalStore.getState().addAssignments("job-open-social", [
      {
        professionalId: "professional-amara",
        agreedPay: 0,
        deadline: ""
      }
    ]);

    expect(useProfessionalStore.getState().assignments).toHaveLength(before);
  });
});
