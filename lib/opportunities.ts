import { analyze, validateProfile, type Profile } from "./checker.ts";

export type InputType = "text" | "image" | "pdf" | "url";
export type RequirementStatus = "met" | "not_met" | "unknown" | "needs_review";
export type EligibilityStatus = "eligible" | "ineligible" | "unknown" | "manual_review";
export type NoticeStatus = "open" | "closed" | "not_stated" | "unknown";
export type DeadlineStatus = "open" | "closed" | "expired" | "unknown";

export type EligibilityRequirement = {
  requirement: string;
  status: RequirementStatus;
  evidence: string;
  mandatory: boolean;
};

export type Opportunity = {
  title: string;
  category: string;
  organizer: string | null;
  summary: string;
  event_date: string | null;
  deadline: string | null;
  deadline_status: DeadlineStatus;
  registration_status: NoticeStatus;
  admission_status: NoticeStatus;
  location: string | null;
  mode: string | null;
  fees: string | null;
  eligibility_status: EligibilityStatus;
  eligibility_requirements: EligibilityRequirement[];
  benefits: string[];
  registration_links: string[];
  required_documents: string[];
  recommended_actions: string[];
  missing_information: string[];
  source_evidence: string[];
  additional_details: { label: string; value: string }[];
  warnings: string[];
};

export type OpportunityReport = {
  input_type: InputType;
  opportunities: Opportunity[];
  warnings: string[];
};

const stringSchema = { type: "string" } as const;
const nullableStringSchema = { type: ["string", "null"] } as const;
const stringArraySchema = { type: "array", items: stringSchema } as const;

export const opportunityResponseSchema = {
  type: "object",
  properties: {
    input_type: {
      type: "string",
      enum: ["text", "image", "pdf", "url"],
    },
    warnings: stringArraySchema,
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: stringSchema,
          category: stringSchema,
          organizer: nullableStringSchema,
          summary: stringSchema,
          event_date: nullableStringSchema,
          deadline: nullableStringSchema,
          deadline_status: {
            type: "string",
            enum: ["open", "closed", "expired", "unknown"],
          },
          registration_status: {
            type: "string",
            enum: ["open", "closed", "not_stated", "unknown"],
          },
          admission_status: {
            type: "string",
            enum: ["open", "closed", "not_stated", "unknown"],
          },
          location: nullableStringSchema,
          mode: nullableStringSchema,
          fees: nullableStringSchema,
          eligibility_status: {
            type: "string",
            enum: ["eligible", "ineligible", "unknown", "manual_review"],
          },
          eligibility_requirements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                requirement: stringSchema,
                status: {
                  type: "string",
                  enum: ["met", "not_met", "unknown", "needs_review"],
                },
                evidence: stringSchema,
                mandatory: { type: "boolean" },
              },
              required: ["requirement", "status", "evidence", "mandatory"],
            },
          },
          benefits: stringArraySchema,
          registration_links: stringArraySchema,
          required_documents: stringArraySchema,
          recommended_actions: stringArraySchema,
          missing_information: stringArraySchema,
          source_evidence: stringArraySchema,
          additional_details: {
            type: "array",
            items: {
              type: "object",
              properties: { label: stringSchema, value: stringSchema },
              required: ["label", "value"],
            },
          },
          warnings: stringArraySchema,
        },
        required: [
          "title",
          "category",
          "organizer",
          "summary",
          "event_date",
          "deadline",
          "deadline_status",
          "registration_status",
          "admission_status",
          "location",
          "mode",
          "fees",
          "eligibility_status",
          "eligibility_requirements",
          "benefits",
          "registration_links",
          "required_documents",
          "recommended_actions",
          "missing_information",
          "source_evidence",
          "additional_details",
          "warnings",
        ],
      },
    },
  },
  required: ["input_type", "opportunities", "warnings"],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string, max = 5000): string {
  if (typeof value !== "string" || value.length > max) {
    throw new Error(`Invalid structured output: ${field} must be a string.`);
  }
  return value;
}

function readNullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return readString(value, field, 5000);
}

function readArray(value: unknown, field: string, maxItems = 100): unknown[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error(`Invalid structured output: ${field} must be an array.`);
  }
  return value;
}

function readStringArray(value: unknown, field: string, maxItems = 100): string[] {
  return readArray(value, field, maxItems).map((item, index) =>
    readString(item, `${field}[${index}]`, 5000),
  );
}

function readEnum<const T extends readonly string[]>(
  value: unknown,
  choices: T,
  field: string,
): T[number] {
  if (typeof value !== "string" || !choices.includes(value)) {
    throw new Error(`Invalid structured output: ${field} has an unsupported value.`);
  }
  return value as T[number];
}

export function validateOpportunityReport(
  input: unknown,
  expectedInputType?: InputType,
): OpportunityReport {
  if (!isRecord(input)) throw new Error("Invalid structured output: expected an object.");
  const inputType = readEnum(input.input_type, ["text", "image", "pdf", "url"] as const, "input_type");
  if (expectedInputType && inputType !== expectedInputType) {
    throw new Error("Invalid structured output: input type did not match the request.");
  }

  const opportunities = readArray(input.opportunities, "opportunities", 25).map(
    (value, index): Opportunity => {
      const field = `opportunities[${index}]`;
      if (!isRecord(value)) throw new Error(`Invalid structured output: ${field} must be an object.`);
      const requirements = readArray(value.eligibility_requirements, `${field}.eligibility_requirements`, 60).map(
        (item, requirementIndex): EligibilityRequirement => {
          const requirementField = `${field}.eligibility_requirements[${requirementIndex}]`;
          if (!isRecord(item)) throw new Error(`Invalid structured output: ${requirementField} must be an object.`);
          if (typeof item.mandatory !== "boolean") {
            throw new Error(`Invalid structured output: ${requirementField}.mandatory must be a boolean.`);
          }
          return {
            requirement: readString(item.requirement, `${requirementField}.requirement`, 1000),
            status: readEnum(item.status, ["met", "not_met", "unknown", "needs_review"] as const, `${requirementField}.status`),
            evidence: readString(item.evidence, `${requirementField}.evidence`, 5000),
            mandatory: item.mandatory,
          };
        },
      );
      const additionalDetails = readArray(value.additional_details, `${field}.additional_details`, 50).map(
        (item, detailIndex) => {
          const detailField = `${field}.additional_details[${detailIndex}]`;
          if (!isRecord(item)) throw new Error(`Invalid structured output: ${detailField} must be an object.`);
          return {
            label: readString(item.label, `${detailField}.label`, 200),
            value: readString(item.value, `${detailField}.value`, 1000),
          };
        },
      );
      const links = readStringArray(value.registration_links, `${field}.registration_links`, 30).map((link) => {
        let parsed: URL;
        try {
          parsed = new URL(link);
        } catch {
          throw new Error(`Invalid structured output: ${field} contains an invalid registration link.`);
        }
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
          throw new Error(`Invalid structured output: ${field} contains an unsafe registration link.`);
        }
        return parsed.toString();
      });

      return {
        title: readString(value.title, `${field}.title`, 300),
        category: readString(value.category, `${field}.category`, 100),
        organizer: readNullableString(value.organizer, `${field}.organizer`),
        summary: readString(value.summary, `${field}.summary`, 2000),
        event_date: readNullableString(value.event_date, `${field}.event_date`),
        deadline: readNullableString(value.deadline, `${field}.deadline`),
        deadline_status: readEnum(value.deadline_status, ["open", "closed", "expired", "unknown"] as const, `${field}.deadline_status`),
        registration_status: readEnum(value.registration_status, ["open", "closed", "not_stated", "unknown"] as const, `${field}.registration_status`),
        admission_status: readEnum(value.admission_status, ["open", "closed", "not_stated", "unknown"] as const, `${field}.admission_status`),
        location: readNullableString(value.location, `${field}.location`),
        mode: readNullableString(value.mode, `${field}.mode`),
        fees: readNullableString(value.fees, `${field}.fees`),
        eligibility_status: readEnum(value.eligibility_status, ["eligible", "ineligible", "unknown", "manual_review"] as const, `${field}.eligibility_status`),
        eligibility_requirements: requirements,
        benefits: readStringArray(value.benefits, `${field}.benefits`, 40),
        registration_links: links,
        required_documents: readStringArray(value.required_documents, `${field}.required_documents`, 50),
        recommended_actions: readStringArray(value.recommended_actions, `${field}.recommended_actions`, 40),
        missing_information: readStringArray(value.missing_information, `${field}.missing_information`, 60),
        source_evidence: readStringArray(value.source_evidence, `${field}.source_evidence`, 100),
        additional_details: additionalDetails,
        warnings: readStringArray(value.warnings, `${field}.warnings`, 60),
      };
    },
  );

  return {
    input_type: inputType,
    opportunities,
    warnings: readStringArray(input.warnings, "warnings", 60),
  };
}

export function groundReportInText(
  report: OpportunityReport,
  sourceText: string,
): OpportunityReport {
  let excludedEvidence = false;
  const opportunities = report.opportunities.map((opportunity) => {
    const sourceEvidence = opportunity.source_evidence.filter((quote) => {
      const grounded = quote.length > 0 && sourceText.includes(quote);
      excludedEvidence ||= !grounded;
      return grounded;
    });
    const eligibilityRequirements = opportunity.eligibility_requirements.map((requirement) => {
      if (requirement.evidence && sourceText.includes(requirement.evidence)) return requirement;
      excludedEvidence = true;
      return { ...requirement, status: "needs_review" as const, evidence: "" };
    });
    const registrationLinks = opportunity.registration_links.filter((link) => {
      const grounded = sourceText.includes(link);
      excludedEvidence ||= !grounded;
      return grounded;
    });
    return {
      ...opportunity,
      eligibility_status: "unknown" as const,
      eligibility_requirements: eligibilityRequirements.map((item) => ({ ...item, status: "unknown" as const })),
      source_evidence: sourceEvidence,
      registration_links: registrationLinks,
      warnings: [...opportunity.warnings],
    };
  });
  return {
    ...report,
    opportunities,
    warnings: excludedEvidence
      ? [...report.warnings, "Some quoted evidence or registration links could not be matched exactly to the pasted notice and were omitted."]
      : report.warnings,
  };
}

export function personalizeReport(report: OpportunityReport, profile: Profile): OpportunityReport {
  const profileIsValid = validateProfile(profile).length === 0;
  return {
    ...report,
    opportunities: report.opportunities.map((opportunity) => {
      const eligibilityRequirements = opportunity.eligibility_requirements.map((requirement) => {
        if (!profileIsValid || !requirement.evidence.trim()) {
          return { ...requirement, status: "needs_review" as const };
        }
        const match = analyze(requirement.evidence, profile);
        if (match.rows.length === 0 || match.review.length > 0 || match.rows.some((row) => row.field === "Required skills")) {
          return { ...requirement, status: "needs_review" as const };
        }
        return {
          ...requirement,
          status: match.rows.every((row) => row.match) ? "met" as const : "not_met" as const,
        };
      });
      const mandatory = eligibilityRequirements.filter((requirement) => requirement.mandatory);
      let eligibilityStatus: EligibilityStatus = "manual_review";
      if (mandatory.length > 0) {
        if (mandatory.some((requirement) => requirement.status === "not_met")) {
          eligibilityStatus = "ineligible";
        } else if (mandatory.every((requirement) => requirement.status === "met")) {
          eligibilityStatus = "eligible";
        }
      }
      const deadlineCheck = opportunity.deadline
        ? analyze(`Application deadline: ${opportunity.deadline}`, profile).deadlineStatus
        : "Not stated";
      const deadlineStatus: DeadlineStatus = deadlineCheck === "Expired"
        ? "expired"
        : deadlineCheck.startsWith("Open by date")
          ? "open"
          : "unknown";
      return {
        ...opportunity,
        deadline_status: deadlineStatus,
        eligibility_status: eligibilityStatus,
        eligibility_requirements: eligibilityRequirements,
      };
    }),
  };
}

export function createLocalReport(
  text: string,
  profile: Profile,
  inputType: "text" | "pdf" = "text",
  fallbackReason?: string,
): OpportunityReport {
  const local = analyze(text, profile);
  const title = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "Untitled notice";
  const requirements = local.rows.map((row) => ({
    requirement: `${row.field}: ${row.explanation}`,
    status: row.field === "Required skills" ? "needs_review" as const : row.match ? "met" as const : "not_met" as const,
    evidence: row.quote,
    mandatory: true,
  }));
  const status: EligibilityStatus = local.verdict === "Eligible"
    ? "eligible"
    : local.verdict === "Ineligible"
      ? "ineligible"
      : "manual_review";
  const deadlineStatus: DeadlineStatus = local.deadlineStatus === "Expired"
    ? "expired"
    : local.deadlineStatus.startsWith("Open")
      ? "open"
      : local.deadlineStatus === "Not stated"
        ? "unknown"
        : "unknown";
  return {
    input_type: inputType,
    warnings: ["Local text-analysis fallback is limited to supported rules. It is not an AI extraction or an official eligibility decision."],
    opportunities: [{
      title,
      category: local.category,
      organizer: null,
      summary: fallbackReason
        ? `${fallbackReason} This local report only checks supported rules against text that could be read.`
        : "This local report checks only supported eligibility rules against readable text.",
      event_date: null,
      deadline: local.deadline === "Not stated" ? null : local.deadline,
      deadline_status: deadlineStatus,
      registration_status: "not_stated",
      admission_status: "not_stated",
      location: null,
      mode: null,
      fees: null,
      eligibility_status: status,
      eligibility_requirements: requirements,
      benefits: [],
      registration_links: [],
      required_documents: local.docs,
      recommended_actions: local.verdict === "Eligible"
        ? ["Confirm the opportunity details and final eligibility with the organizer."]
        : ["Review the original notice and unresolved criteria with the organizer."],
      missing_information: local.review,
      source_evidence: text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 100),
      additional_details: [],
      warnings: [
        "This local result is not an independently verified opportunity or official eligibility decision.",
        ...(local.rows.some((row) => row.field === "Required skills")
          ? ["Self-reported skill names do not demonstrate programming proficiency."]
          : []),
      ],
    }],
  };
}
